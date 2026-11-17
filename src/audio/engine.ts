/**
 * The audio engine: owns the AudioContext and the mix graph
 *
 *   music bus --+
 *               +--> master gain --> compressor --> speakers
 *   sfx bus  ---+
 *
 * and exposes the small API the game uses. Audio is strictly best-effort: if
 * Web Audio is missing or fails, every method quietly does nothing.
 */
import type { SfxId, SongId } from '../data/audio-ids';
import type { AudioEngine } from './index';
import { playEvent } from './instruments';
import { compileSong, createSequencer, type CompiledSong, type Sequencer } from './sequencer';
import { createSfxPlayer, type SfxPlayer } from './sfx-player';
import { SONGS } from './songs';

/** Bus levels. Music sits well under the effects so hits always read clearly. */
export const MIX = { master: 0.9, music: 0.26, sfx: 0.8 } as const;

const MUTE_STORAGE_KEY = 'red-cliffs-ablaze.audio.muted';
const MUTED_FLAG = '1';
const UNMUTED_FLAG = '0';
const MUTE_RAMP_S = 0.015;
/**
 * A freshly created or resumed context takes a moment to report "running".
 * Effects asked for within this window of an unlock still play (they start as
 * soon as the context does); outside it, a stopped context drops them so they
 * cannot pile up and blast out later.
 */
const UNLOCK_GRACE_MS = 300;
/**
 * A limiter for the moments when several loud effects pile up. The high
 * threshold also keeps the node's automatic make-up gain small (under 2 dB).
 */
const COMPRESSOR = { threshold: -3, knee: 3, ratio: 20, attack: 0.002, release: 0.12 } as const;

type AudioContextCtor = new () => AudioContext;
type SongCache = Map<SongId, CompiledSong | null>;

interface Graph {
  readonly ctx: AudioContext;
  readonly master: GainNode;
  readonly sequencer: Sequencer;
  readonly sfx: SfxPlayer;
}

function findContextCtor(): AudioContextCtor | null {
  const scope = globalThis as typeof globalThis & { webkitAudioContext?: AudioContextCtor };
  if (typeof scope.AudioContext === 'function') return scope.AudioContext;
  return scope.webkitAudioContext ?? null;
}

function readMuted(): boolean {
  try {
    return globalThis.localStorage?.getItem(MUTE_STORAGE_KEY) === MUTED_FLAG;
  } catch {
    // Storage can be blocked (private mode, sandboxed frame): start unmuted.
    return false;
  }
}

function writeMuted(muted: boolean): void {
  try {
    globalThis.localStorage?.setItem(MUTE_STORAGE_KEY, muted ? MUTED_FLAG : UNMUTED_FLAG);
  } catch {
    // Storage can be blocked: the choice then lasts for this session only.
  }
}

function buildGraph(Ctor: AudioContextCtor, muted: boolean): Graph | null {
  try {
    const ctx = new Ctor();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = COMPRESSOR.threshold;
    compressor.knee.value = COMPRESSOR.knee;
    compressor.ratio.value = COMPRESSOR.ratio;
    compressor.attack.value = COMPRESSOR.attack;
    compressor.release.value = COMPRESSOR.release;
    const master = ctx.createGain();
    const music = ctx.createGain();
    const sfx = ctx.createGain();
    master.gain.value = muted ? 0 : MIX.master;
    music.gain.value = MIX.music;
    sfx.gain.value = MIX.sfx;
    music.connect(master);
    sfx.connect(master);
    master.connect(compressor).connect(ctx.destination);
    const sequencer = createSequencer(ctx, music, (out, event, when) =>
      playEvent(ctx, out, event, when),
    );
    return { ctx, master, sequencer, sfx: createSfxPlayer(ctx, sfx) };
  } catch {
    // No usable audio device, or the browser refused: stay silent for good.
    return null;
  }
}

/** A rejected suspend / resume leaves the game silent, which is the designed fallback. */
function ignoreRejection(pending: Promise<void>): void {
  pending.catch(() => undefined);
}

/** Bring the context in line with whether the game wants audio suspended. */
function syncRunState(ctx: AudioContext, suspended: boolean): void {
  if (ctx.state === 'closed') return;
  if (suspended && ctx.state === 'running') ignoreRejection(ctx.suspend());
  if (!suspended && ctx.state !== 'running') ignoreRejection(ctx.resume());
}

function compiledSong(cache: SongCache, id: SongId): CompiledSong | null {
  const known = cache.get(id);
  if (known !== undefined) return known;
  try {
    const song = compileSong(SONGS[id]);
    cache.set(id, song);
    return song;
  } catch {
    // Malformed song data must never take the game down; it just has no music.
    cache.set(id, null);
    return null;
  }
}

/** Replace whatever is playing with song `id` (null: silence). */
function startSong(graph: Graph, cache: SongCache, id: SongId | null): void {
  graph.sequencer.stop();
  const song = id === null ? null : compiledSong(cache, id);
  if (song !== null) graph.sequencer.play(song);
}

/** Web Audio is unavailable: only the mute preference is kept. */
function createSilentEngine(): AudioEngine {
  let muted = readMuted();
  return {
    unlock: () => undefined,
    playSfx: () => undefined,
    playSong: () => undefined,
    setMuted(next: boolean): void {
      muted = next;
      writeMuted(next);
    },
    isMuted: () => muted,
    setSuspended: () => undefined,
  };
}

function createLiveEngine(Ctor: AudioContextCtor): AudioEngine {
  const songs: SongCache = new Map();
  let graph: Graph | null = null;
  let failed = false;
  let muted = readMuted();
  let suspended = false;
  let requested: SongId | null = null;
  let unlockedAtMs = Number.NEGATIVE_INFINITY;

  return {
    unlock(): void {
      if (failed) return;
      if (graph === null) {
        graph = buildGraph(Ctor, muted);
        if (graph === null) {
          failed = true;
          return;
        }
        // Armed once, at creation. Re-arming on every key press would let effects
        // queue up on a context that is stuck suspended and burst out later.
        unlockedAtMs = performance.now();
        startSong(graph, songs, requested);
      }
      syncRunState(graph.ctx, suspended);
    },
    playSfx(id: SfxId): void {
      if (graph === null || muted || suspended) return;
      const starting = performance.now() - unlockedAtMs < UNLOCK_GRACE_MS;
      if (graph.ctx.state === 'running' || starting) graph.sfx.play(id);
    },
    playSong(id: SongId | null): void {
      if (id === requested) return;
      requested = id;
      if (graph !== null) startSong(graph, songs, id);
    },
    setMuted(next: boolean): void {
      muted = next;
      writeMuted(next);
      if (graph === null) return;
      const level = next ? 0 : MIX.master;
      graph.master.gain.setTargetAtTime(level, graph.ctx.currentTime, MUTE_RAMP_S);
    },
    isMuted: () => muted,
    setSuspended(next: boolean): void {
      suspended = next;
      if (graph !== null) syncRunState(graph.ctx, suspended);
    },
  };
}

export function createAudioEngine(): AudioEngine {
  const Ctor = findContextCtor();
  return Ctor === null ? createSilentEngine() : createLiveEngine(Ctor);
}

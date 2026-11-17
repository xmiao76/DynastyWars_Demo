/**
 * Turns a sound-effect recipe into sound. `scheduleRecipe` builds the node
 * graph on any context (live or offline); `renderRecipe` bakes a recipe into
 * an AudioBuffer so that playing it later costs a single source node.
 */
import { startNoise } from './noise';
import { SILENCE, STOP_PAD_S } from './nodes';
import {
  recipeDuration,
  type FilterSpec,
  type SfxLayer,
  type SfxRecipe,
  type ToneLayer,
} from './sfx-types';

/** Silence rendered after the last release so a tail is never cut off. */
const RENDER_TAIL_S = 0.03;

export interface RenderedSfx {
  readonly buffer: AudioBuffer;
  /** Largest absolute sample value, used to normalise playback level. */
  readonly peak: number;
}

type OfflineContextCtor = new (
  channels: number,
  length: number,
  sampleRate: number,
) => OfflineAudioContext;

function findOfflineCtor(): OfflineContextCtor | null {
  const scope = globalThis as typeof globalThis & {
    webkitOfflineAudioContext?: OfflineContextCtor;
  };
  if (typeof scope.OfflineAudioContext === 'function') return scope.OfflineAudioContext;
  return scope.webkitOfflineAudioContext ?? null;
}

function toneSource(
  ctx: BaseAudioContext,
  layer: ToneLayer,
  time: number,
  end: number,
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = layer.wave;
  osc.frequency.setValueAtTime(layer.hz, time);
  if (layer.hzEnd !== layer.hz) osc.frequency.exponentialRampToValueAtTime(layer.hzEnd, end);
  if (layer.vibrato !== undefined) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = layer.vibrato.rate;
    depth.gain.value = layer.vibrato.depth;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(time);
    lfo.stop(end + STOP_PAD_S);
  }
  osc.start(time);
  osc.stop(end + STOP_PAD_S);
  return osc;
}

function filterNode(
  ctx: BaseAudioContext,
  spec: FilterSpec,
  time: number,
  end: number,
): BiquadFilterNode {
  const filter = ctx.createBiquadFilter();
  filter.type = spec.kind;
  filter.Q.value = spec.q;
  filter.frequency.setValueAtTime(spec.hz, time);
  if (spec.hzEnd !== spec.hz) filter.frequency.exponentialRampToValueAtTime(spec.hzEnd, end);
  return filter;
}

/** ADSR: linear attack, exponential decay to the sustain level, exponential release. */
function applyEnvelope(param: AudioParam, layer: SfxLayer, time: number): void {
  const { a, d, s, r } = layer.env;
  const sustain = Math.max(layer.gain * s, SILENCE);
  const releaseAt = time + layer.dur;
  param.setValueAtTime(0, time);
  param.linearRampToValueAtTime(layer.gain, time + a);
  if (d > 0) param.exponentialRampToValueAtTime(sustain, time + a + d);
  param.setValueAtTime(sustain, releaseAt);
  param.exponentialRampToValueAtTime(SILENCE, releaseAt + r);
  param.setValueAtTime(0, releaseAt + r);
}

function scheduleLayer(
  ctx: BaseAudioContext,
  out: AudioNode,
  layer: SfxLayer,
  time: number,
): void {
  const end = time + layer.dur + layer.env.r;
  const source =
    layer.kind === 'tone'
      ? toneSource(ctx, layer, time, end)
      : startNoise(ctx, time, end + STOP_PAD_S);
  const amp = ctx.createGain();
  applyEnvelope(amp.gain, layer, time);
  const shaped =
    layer.filter === undefined ? source : source.connect(filterNode(ctx, layer.filter, time, end));
  shaped.connect(amp).connect(out);
}

/** Build the recipe's node graph on `out`, starting at clock time `time`. */
export function scheduleRecipe(
  ctx: BaseAudioContext,
  out: AudioNode,
  recipe: SfxRecipe,
  time: number,
): void {
  for (const layer of recipe.layers) scheduleLayer(ctx, out, layer, time + layer.at);
}

function peakOf(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < data.length; i += 1) peak = Math.max(peak, Math.abs(data[i]));
  return peak;
}

/**
 * Bake a recipe into a mono buffer. Resolves to null when offline rendering is
 * unavailable or fails; callers then fall back to live synthesis.
 */
export async function renderRecipe(
  recipe: SfxRecipe,
  sampleRate: number,
): Promise<RenderedSfx | null> {
  const Ctor = findOfflineCtor();
  if (Ctor === null) return null;
  try {
    const length = Math.ceil((recipeDuration(recipe) + RENDER_TAIL_S) * sampleRate);
    const ctx = new Ctor(1, length, sampleRate);
    scheduleRecipe(ctx, ctx.destination, recipe, 0);
    const buffer = await ctx.startRendering();
    return { buffer, peak: peakOf(buffer) };
  } catch {
    // Pre-rendering is an optimisation only: report "not rendered" and let the
    // player synthesise this effect live instead.
    return null;
  }
}

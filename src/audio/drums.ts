/** The drum kit: each drum is data (pitched thumps plus filtered noise hits). */
import { startNoise } from './noise';
import { STOP_PAD_S, filterOf, gainOf, percEnvelope, startOsc } from './nodes';
import type { DrumId } from './sequencer';

interface ToneHit {
  readonly wave: OscillatorType;
  readonly fromHz: number;
  readonly toHz: number;
  /** Seconds the pitch takes to move from `fromHz` to `toHz`. */
  readonly sweep: number;
  readonly decay: number;
  readonly level: number;
}

interface NoiseHit {
  readonly filter: BiquadFilterType;
  readonly hz: number;
  readonly q: number;
  readonly decay: number;
  readonly level: number;
}

interface DrumSpec {
  readonly tones: readonly ToneHit[];
  readonly noises: readonly NoiseHit[];
}

const DRUM_ATTACK = 0.002;

const DRUM_KIT: Record<DrumId, DrumSpec> = {
  // Low war drum: a pitched "dong" with a short stick slap on top.
  war: {
    tones: [
      { wave: 'sine', fromHz: 128, toHz: 50, sweep: 0.11, decay: 0.3, level: 0.75 },
      { wave: 'triangle', fromHz: 250, toHz: 96, sweep: 0.07, decay: 0.1, level: 0.2 },
    ],
    noises: [{ filter: 'lowpass', hz: 1100, q: 0.7, decay: 0.035, level: 0.22 }],
  },
  tom: {
    tones: [{ wave: 'sine', fromHz: 235, toHz: 118, sweep: 0.1, decay: 0.2, level: 0.7 }],
    noises: [{ filter: 'bandpass', hz: 1400, q: 1, decay: 0.025, level: 0.18 }],
  },
  // Rim shot / wooden clapper.
  rim: {
    tones: [
      { wave: 'triangle', fromHz: 1150, toHz: 980, sweep: 0.02, decay: 0.045, level: 0.4 },
      { wave: 'square', fromHz: 620, toHz: 560, sweep: 0.02, decay: 0.03, level: 0.12 },
    ],
    noises: [{ filter: 'bandpass', hz: 2600, q: 2, decay: 0.02, level: 0.25 }],
  },
  cym: {
    tones: [],
    noises: [
      { filter: 'highpass', hz: 6500, q: 0.7, decay: 0.28, level: 0.3 },
      { filter: 'bandpass', hz: 9500, q: 3, decay: 0.12, level: 0.15 },
    ],
  },
  // Large gong: inharmonic partials that die away at different rates.
  gong: {
    tones: [
      { wave: 'sine', fromHz: 98, toHz: 95, sweep: 1.2, decay: 2.4, level: 0.5 },
      { wave: 'sine', fromHz: 147, toHz: 144, sweep: 1, decay: 2, level: 0.3 },
      { wave: 'sine', fromHz: 207, toHz: 205, sweep: 0.8, decay: 1.5, level: 0.2 },
      { wave: 'sine', fromHz: 271, toHz: 269, sweep: 0.6, decay: 1.1, level: 0.13 },
      { wave: 'triangle', fromHz: 388, toHz: 384, sweep: 0.5, decay: 0.7, level: 0.08 },
    ],
    noises: [{ filter: 'bandpass', hz: 800, q: 0.8, decay: 0.18, level: 0.1 }],
  },
};

function toneHit(
  ctx: BaseAudioContext,
  out: AudioNode,
  hit: ToneHit,
  time: number,
  velocity: number,
): void {
  const osc = startOsc(ctx, hit.wave, hit.fromHz, time, time + DRUM_ATTACK + hit.decay);
  osc.frequency.setValueAtTime(hit.fromHz, time);
  osc.frequency.exponentialRampToValueAtTime(hit.toHz, time + hit.sweep);
  const amp = gainOf(ctx, 0);
  percEnvelope(amp.gain, time, hit.level * velocity, DRUM_ATTACK, hit.decay);
  osc.connect(amp).connect(out);
}

function noiseHit(
  ctx: BaseAudioContext,
  out: AudioNode,
  hit: NoiseHit,
  time: number,
  velocity: number,
): void {
  const amp = gainOf(ctx, 0);
  percEnvelope(amp.gain, time, hit.level * velocity, DRUM_ATTACK, hit.decay);
  startNoise(ctx, time, time + DRUM_ATTACK + hit.decay + STOP_PAD_S)
    .connect(filterOf(ctx, hit.filter, hit.hz, hit.q))
    .connect(amp)
    .connect(out);
}

/** Strike one drum on `out` at clock time `time`. */
export function playDrum(
  ctx: BaseAudioContext,
  out: AudioNode,
  id: DrumId,
  time: number,
  velocity: number,
): void {
  const spec = DRUM_KIT[id];
  for (const hit of spec.tones) toneHit(ctx, out, hit, time, velocity);
  for (const hit of spec.noises) noiseHit(ctx, out, hit, time, velocity);
}

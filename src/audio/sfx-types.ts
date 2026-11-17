/**
 * The sound-effect data model: a recipe is a stack of oscillator / noise
 * layers, each with a pitch sweep, an ADSR envelope and an optional filter.
 * The small builders below keep the recipe tables to one line per layer.
 * Nothing here touches Web Audio.
 */

export type Wave = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type FilterKind = 'lowpass' | 'highpass' | 'bandpass';

/** Seconds for attack / decay / release; `s` is the sustain level (0..1 of the peak). */
export interface Envelope {
  readonly a: number;
  readonly d: number;
  readonly s: number;
  readonly r: number;
}

export interface FilterSpec {
  readonly kind: FilterKind;
  readonly hz: number;
  /** Cutoff at the end of the layer (exponential sweep). */
  readonly hzEnd: number;
  readonly q: number;
}

export interface Vibrato {
  readonly rate: number;
  /** Peak deviation in Hz. */
  readonly depth: number;
}

interface LayerBase {
  /** Start offset within the effect, in seconds. */
  readonly at: number;
  /** Seconds from the layer's start until its release begins. */
  readonly dur: number;
  /** Peak gain before the recipe is normalised to its `level`. */
  readonly gain: number;
  readonly env: Envelope;
  readonly filter?: FilterSpec;
}

export interface ToneLayer extends LayerBase {
  readonly kind: 'tone';
  readonly wave: Wave;
  readonly hz: number;
  /** Pitch at the end of the layer (exponential sweep). */
  readonly hzEnd: number;
  readonly vibrato?: Vibrato;
}

export interface NoiseLayer extends LayerBase {
  readonly kind: 'noise';
}

export type SfxLayer = ToneLayer | NoiseLayer;

export interface SfxRecipe {
  /** Peak level (0..1) on the effects bus once the recipe is rendered. */
  readonly level: number;
  /** Musical cues keep an exact pitch; everything else gets a little random variance. */
  readonly steady?: boolean;
  readonly layers: readonly SfxLayer[];
}

/** The timing half of a layer: how long it lasts and how its level moves. */
export type Shape = Pick<LayerBase, 'dur' | 'env'>;
export type ToneExtra = Partial<Pick<ToneLayer, 'at' | 'filter' | 'vibrato'>>;

const CLICK_ATTACK = 0.002;
const SHORT_RELEASE = 0.012;
const BROAD_Q = 0.7;
const BAND_Q = 1;

export const adsr = (a: number, d: number, s: number, dur: number, r: number): Shape => ({
  dur,
  env: { a, d, s, r },
});

/** Rise over `a`, then decay to silence over `d`. */
export const swell = (a: number, d: number): Shape => adsr(a, d, 0, a + d, SHORT_RELEASE);

/** Percussive: instant attack, decay to silence over `d`. */
export const perc = (d: number): Shape => swell(CLICK_ATTACK, d);

/** Flat: full level from the attack until `dur`. */
export const held = (a: number, dur: number, r: number): Shape => adsr(a, 0, 1, dur, r);

export const lp = (hz: number, hzEnd = hz, q = BROAD_Q): FilterSpec => ({
  kind: 'lowpass',
  hz,
  hzEnd,
  q,
});

export const hp = (hz: number, q = BROAD_Q): FilterSpec => ({ kind: 'highpass', hz, hzEnd: hz, q });

export const bp = (hz: number, hzEnd = hz, q = BAND_Q): FilterSpec => ({
  kind: 'bandpass',
  hz,
  hzEnd,
  q,
});

/** An oscillator layer sweeping from `hz` to `hzEnd` (equal values hold the pitch). */
export const tone = (
  wave: Wave,
  hz: number,
  hzEnd: number,
  shape: Shape,
  gain: number,
  extra: ToneExtra = {},
): ToneLayer => ({ kind: 'tone', wave, hz, hzEnd, gain, at: 0, ...shape, ...extra });

/** A filtered white-noise layer starting `at` seconds into the effect. */
export const noise = (filter: FilterSpec, shape: Shape, gain: number, at = 0): NoiseLayer => ({
  kind: 'noise',
  filter,
  gain,
  at,
  ...shape,
});

/** Seconds from the start of the effect until its last layer has fully released. */
export function recipeDuration(recipe: SfxRecipe): number {
  return recipe.layers.reduce(
    (longest, layer) => Math.max(longest, layer.at + layer.dur + layer.env.r),
    0,
  );
}

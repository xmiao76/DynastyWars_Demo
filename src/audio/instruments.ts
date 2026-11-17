/**
 * Small synth voices for the music: a plucked string (pipa / guzheng-like), a
 * breathy flute, a bass, a drone pad and a brass-like horn; the drum kit lives
 * in `drums.ts`. Every voice is a throwaway node graph scheduled on the audio
 * clock; sources stop themselves, so nothing has to be cleaned up by hand.
 */
import { playDrum } from './drums';
import { startNoise } from './noise';
import { STOP_PAD_S, filterOf, gainOf, heldEnvelope, percEnvelope, startOsc } from './nodes';
import type { NoteEvent, PitchedInstrumentId } from './sequencer';

interface Voice {
  readonly ctx: BaseAudioContext;
  readonly out: AudioNode;
  readonly time: number;
  readonly duration: number;
  readonly frequency: number;
  readonly velocity: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const PLUCK = {
  level: 0.8,
  attack: 0.003,
  /** Natural ring time at `refHz`; higher strings die away sooner. */
  decayAtRef: 0.75,
  refHz: 440,
  decayMin: 0.2,
  decayMax: 1.2,
  /** How long a string keeps ringing after its step ends. */
  ring: 0.4,
  bendCents: 26,
  bendTime: 0.045,
  filterOpen: 9,
  filterClosed: 2.2,
  filterMaxHz: 9000,
  filterTime: 0.14,
  filterQ: 1.2,
} as const;

const PLUCK_PARTIALS = [
  { wave: 'sawtooth', cents: -6, mix: 0.55 },
  { wave: 'triangle', cents: 7, mix: 0.45 },
] as const;

function pluck(v: Voice): void {
  const { ctx, time, frequency } = v;
  const natural = PLUCK.decayAtRef * Math.sqrt(PLUCK.refHz / frequency);
  const decay = Math.min(clamp(natural, PLUCK.decayMin, PLUCK.decayMax), v.duration + PLUCK.ring);
  const end = time + PLUCK.attack + decay;
  const amp = gainOf(ctx, 0);
  percEnvelope(amp.gain, time, PLUCK.level * v.velocity, PLUCK.attack, decay);
  const openHz = Math.min(frequency * PLUCK.filterOpen, PLUCK.filterMaxHz);
  const filter = filterOf(ctx, 'lowpass', openHz, PLUCK.filterQ);
  filter.frequency.setValueAtTime(openHz, time);
  filter.frequency.exponentialRampToValueAtTime(
    frequency * PLUCK.filterClosed,
    time + PLUCK.filterTime,
  );
  filter.connect(amp).connect(v.out);
  // The pitch starts sharp and settles: the twang of a string being released.
  for (const partial of PLUCK_PARTIALS) {
    const osc = startOsc(ctx, partial.wave, frequency, time, end);
    osc.detune.setValueAtTime(partial.cents + PLUCK.bendCents, time);
    osc.detune.linearRampToValueAtTime(partial.cents, time + PLUCK.bendTime);
    osc.connect(gainOf(ctx, partial.mix)).connect(filter);
  }
}

const FLUTE = {
  level: 0.34,
  gate: 0.92,
  attackMax: 0.045,
  attackShare: 0.3,
  release: 0.09,
  overtoneMix: 0.16,
  scoopCents: -35,
  scoopMax: 0.06,
  scoopShare: 0.3,
  vibratoHz: 5.4,
  vibratoCents: 13,
  vibratoDelay: 0.16,
  vibratoRise: 0.25,
  breathLevel: 0.05,
  breathRatio: 2.5,
  breathQ: 0.9,
  breathAttack: 0.012,
  breathDecay: 0.14,
} as const;

/** A puff of filtered noise at the start of a flute note. */
function breath(v: Voice): void {
  const { ctx, time } = v;
  const end = time + FLUTE.breathAttack + FLUTE.breathDecay;
  const amp = gainOf(ctx, 0);
  const peak = FLUTE.breathLevel * v.velocity;
  percEnvelope(amp.gain, time, peak, FLUTE.breathAttack, FLUTE.breathDecay);
  startNoise(ctx, time, end + STOP_PAD_S)
    .connect(filterOf(ctx, 'bandpass', v.frequency * FLUTE.breathRatio, FLUTE.breathQ))
    .connect(amp)
    .connect(v.out);
}

function flute(v: Voice): void {
  const { ctx, time, frequency } = v;
  const held = v.duration * FLUTE.gate;
  const attack = Math.min(FLUTE.attackMax, held * FLUTE.attackShare);
  const scoop = Math.min(FLUTE.scoopMax, held * FLUTE.scoopShare);
  const end = time + held + FLUTE.release;
  const amp = gainOf(ctx, 0);
  heldEnvelope(amp.gain, time, FLUTE.level * v.velocity, attack, held, FLUTE.release);
  amp.connect(v.out);
  const body = startOsc(ctx, 'triangle', frequency, time, end);
  const overtone = startOsc(ctx, 'sine', frequency * 2, time, end);
  body.connect(amp);
  overtone.connect(gainOf(ctx, FLUTE.overtoneMix)).connect(amp);
  // Vibrato fades in after the note has settled, as a player would add it.
  const depth = gainOf(ctx, 0);
  const vibratoStart = time + FLUTE.vibratoDelay;
  depth.gain.setValueAtTime(0, vibratoStart);
  depth.gain.linearRampToValueAtTime(FLUTE.vibratoCents, vibratoStart + FLUTE.vibratoRise);
  startOsc(ctx, 'sine', FLUTE.vibratoHz, time, end).connect(depth);
  for (const osc of [body, overtone]) {
    osc.detune.setValueAtTime(FLUTE.scoopCents, time);
    osc.detune.linearRampToValueAtTime(0, time + scoop);
    depth.connect(osc.detune);
  }
  breath(v);
}

const BASS = {
  level: 0.28,
  gate: 0.85,
  attack: 0.005,
  release: 0.05,
  squareMix: 0.2,
  filterRatio: 6,
  filterMinHz: 420,
  filterQ: 0.7,
} as const;

function bass(v: Voice): void {
  const { ctx, time, frequency } = v;
  const held = v.duration * BASS.gate;
  const end = time + held + BASS.release;
  const amp = gainOf(ctx, 0);
  heldEnvelope(amp.gain, time, BASS.level * v.velocity, BASS.attack, held, BASS.release);
  const cutoff = Math.max(frequency * BASS.filterRatio, BASS.filterMinHz);
  const filter = filterOf(ctx, 'lowpass', cutoff, BASS.filterQ);
  filter.connect(amp).connect(v.out);
  startOsc(ctx, 'triangle', frequency, time, end).connect(filter);
  startOsc(ctx, 'square', frequency, time, end).connect(gainOf(ctx, BASS.squareMix)).connect(filter);
}

const PAD = {
  level: 0.17,
  attackMax: 0.7,
  attackShare: 0.35,
  /** Long enough to overlap the next drone note, so the pad never gaps. */
  release: 0.9,
  detuneCents: 9,
  sawMix: 0.5,
  subMix: 0.6,
  filterRatio: 5,
  filterMaxHz: 900,
  filterQ: 0.7,
} as const;

function pad(v: Voice): void {
  const { ctx, time, frequency } = v;
  const attack = Math.min(PAD.attackMax, v.duration * PAD.attackShare);
  const end = time + v.duration + PAD.release;
  const amp = gainOf(ctx, 0);
  heldEnvelope(amp.gain, time, PAD.level * v.velocity, attack, v.duration, PAD.release);
  amp.connect(v.out);
  const cutoff = Math.min(frequency * PAD.filterRatio, PAD.filterMaxHz);
  const filter = filterOf(ctx, 'lowpass', cutoff, PAD.filterQ);
  filter.connect(amp);
  for (const cents of [-PAD.detuneCents, PAD.detuneCents]) {
    const osc = startOsc(ctx, 'sawtooth', frequency, time, end);
    osc.detune.value = cents;
    osc.connect(gainOf(ctx, PAD.sawMix)).connect(filter);
  }
  startOsc(ctx, 'sine', frequency, time, end).connect(gainOf(ctx, PAD.subMix)).connect(amp);
}

const HORN = {
  level: 0.3,
  gate: 0.9,
  attackMax: 0.035,
  attackShare: 0.3,
  release: 0.1,
  detuneCents: 7,
  /** The filter opens with the attack (the brassy "blat") and then settles. */
  filterStart: 1.5,
  filterPeak: 5.5,
  filterSustain: 3.2,
  filterAttack: 0.07,
  filterSettle: 0.1,
  filterMaxHz: 6000,
  filterQ: 0.8,
} as const;

function horn(v: Voice): void {
  const { ctx, time, frequency } = v;
  const held = v.duration * HORN.gate;
  const attack = Math.min(HORN.attackMax, held * HORN.attackShare);
  const end = time + held + HORN.release;
  const amp = gainOf(ctx, 0);
  heldEnvelope(amp.gain, time, HORN.level * v.velocity, attack, held, HORN.release);
  const filter = filterOf(ctx, 'lowpass', frequency * HORN.filterStart, HORN.filterQ);
  const peakHz = Math.min(frequency * HORN.filterPeak, HORN.filterMaxHz);
  const sustainHz = Math.min(frequency * HORN.filterSustain, HORN.filterMaxHz);
  filter.frequency.setValueAtTime(frequency * HORN.filterStart, time);
  filter.frequency.linearRampToValueAtTime(peakHz, time + HORN.filterAttack);
  filter.frequency.setTargetAtTime(sustainHz, time + HORN.filterAttack, HORN.filterSettle);
  filter.connect(amp).connect(v.out);
  for (const cents of [-HORN.detuneCents, HORN.detuneCents]) {
    const osc = startOsc(ctx, 'sawtooth', frequency, time, end);
    osc.detune.value = cents;
    osc.connect(filter);
  }
}

const PITCHED_VOICES: Record<PitchedInstrumentId, (voice: Voice) => void> = {
  pluck,
  flute,
  bass,
  pad,
  horn,
};

/** Sound one compiled note event on `out`, starting at clock time `when`. */
export function playEvent(
  ctx: BaseAudioContext,
  out: AudioNode,
  event: NoteEvent,
  when: number,
): void {
  if (event.instrument === 'drums') {
    playDrum(ctx, out, event.drum, when, event.velocity);
    return;
  }
  PITCHED_VOICES[event.instrument]({
    ctx,
    out,
    time: when,
    duration: event.duration,
    frequency: event.frequency,
    velocity: event.velocity,
  });
}

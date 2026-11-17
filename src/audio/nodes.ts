/** Small Web Audio building blocks shared by the instruments and the drum kit. */

/** Exponential ramps cannot reach zero, so envelopes decay to this floor. */
export const SILENCE = 0.0001;
/** Sources stop slightly after their envelope has closed. */
export const STOP_PAD_S = 0.03;

export function gainOf(ctx: BaseAudioContext, value: number): GainNode {
  const node = ctx.createGain();
  node.gain.value = value;
  return node;
}

export function filterOf(
  ctx: BaseAudioContext,
  type: BiquadFilterType,
  hz: number,
  q: number,
): BiquadFilterNode {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = hz;
  node.Q.value = q;
  return node;
}

/** An oscillator that starts at `time` and stops just after `stopTime`. */
export function startOsc(
  ctx: BaseAudioContext,
  type: OscillatorType,
  hz: number,
  time: number,
  stopTime: number,
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = hz;
  osc.start(time);
  osc.stop(stopTime + STOP_PAD_S);
  return osc;
}

/** Fast linear attack, then an exponential decay to silence. */
export function percEnvelope(
  param: AudioParam,
  time: number,
  peak: number,
  attack: number,
  decay: number,
): void {
  param.setValueAtTime(0, time);
  param.linearRampToValueAtTime(Math.max(peak, SILENCE), time + attack);
  param.exponentialRampToValueAtTime(SILENCE, time + attack + decay);
}

/** Linear attack, hold at `peak` until `held` seconds in, then a linear release. */
export function heldEnvelope(
  param: AudioParam,
  time: number,
  peak: number,
  attack: number,
  held: number,
  release: number,
): void {
  const releaseAt = time + Math.max(held, attack);
  param.setValueAtTime(0, time);
  param.linearRampToValueAtTime(peak, time + attack);
  param.setValueAtTime(peak, releaseAt);
  param.linearRampToValueAtTime(0, releaseAt + release);
}

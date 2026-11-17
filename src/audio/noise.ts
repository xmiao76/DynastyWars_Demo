/** Shared white-noise source for drums, breath and noise-based sound effects. */

const NOISE_SECONDS = 1.5;
/** Keep random start offsets clear of the very end of the buffer. */
const OFFSET_MARGIN_S = 0.1;

let cached: AudioBuffer | null = null;

/** One buffer of white noise, reused by every context with the same sample rate. */
export function getNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  if (cached !== null && cached.sampleRate === ctx.sampleRate) return cached;
  const length = Math.floor(ctx.sampleRate * NOISE_SECONDS);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  cached = buffer;
  return buffer;
}

/** A looping noise source that plays from `time` to `stopTime` from a random offset. */
export function startNoise(
  ctx: BaseAudioContext,
  time: number,
  stopTime: number,
): AudioBufferSourceNode {
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  source.loop = true;
  source.start(time, Math.random() * (NOISE_SECONDS - OFFSET_MARGIN_S));
  source.stop(stopTime);
  return source;
}

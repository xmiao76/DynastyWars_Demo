/**
 * Seeded RNG (mulberry32). The state is a plain uint32 kept by the caller, so
 * it can live inside the world record and be replayed exactly.
 */
const RNG_INCREMENT = 0x6d2b79f5;
const UINT32_RANGE = 4294967296;

/** Advance the generator state by one step. */
export function rngNext(state: number): number {
  return (state + RNG_INCREMENT) >>> 0;
}

/** Map a generator state to a float in [0, 1). */
export function rngValue(state: number): number {
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
}

/** Normalise any number into a usable seed. */
export function seedFrom(value: number): number {
  return (Math.floor(value) >>> 0) || 1;
}

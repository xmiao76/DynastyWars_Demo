/** Axis-aligned box. x grows forward/right, y grows upward from the ground. */
export interface Box {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}

export function box(x0: number, x1: number, y0: number, y1: number): Box {
  return { x0, x1, y0, y1 };
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function sign(value: number): -1 | 0 | 1 {
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Move `value` toward `target` by at most `step`. */
export function approach(value: number, target: number, step: number): number {
  if (value < target) return Math.min(value + step, target);
  return Math.max(value - step, target);
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0;
}

/**
 * Place a fighter-relative box in the world. `facing` mirrors the box around
 * the fighter's x; `y` lifts it by the fighter's height above the ground.
 */
export function placeBox(local: Box, x: number, y: number, facing: 1 | -1): Box {
  const a = x + local.x0 * facing;
  const b = x + local.x1 * facing;
  return { x0: Math.min(a, b), x1: Math.max(a, b), y0: local.y0 + y, y1: local.y1 + y };
}

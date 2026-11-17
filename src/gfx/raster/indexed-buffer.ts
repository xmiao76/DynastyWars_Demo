/**
 * A small software canvas of palette indices (0 = transparent). Sprites are
 * drawn here instead of with Canvas 2D paths, which are always anti-aliased,
 * so every pixel is a deliberate palette colour and the output is identical
 * in every browser and in Node.
 */
export interface IndexedBuffer {
  readonly w: number;
  readonly h: number;
  readonly px: Uint8Array;
}

export function createBuffer(w: number, h: number): IndexedBuffer {
  return { w, h, px: new Uint8Array(w * h) };
}

export function clearBuffer(b: IndexedBuffer): void {
  b.px.fill(0);
}

export function setPx(b: IndexedBuffer, x: number, y: number, color: number): void {
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return;
  b.px[y * b.w + x] = color;
}

export function getPx(b: IndexedBuffer, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return 0;
  return b.px[y * b.w + x];
}

export interface Bounds {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/** Tight bounds of the non-transparent pixels, or null if the buffer is empty. */
export function contentBounds(b: IndexedBuffer): Bounds | null {
  let x0 = b.w;
  let y0 = b.h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < b.h; y++) {
    for (let x = 0; x < b.w; x++) {
      if (b.px[y * b.w + x] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/** Copy a rectangle out into a new buffer. */
export function cropBuffer(b: IndexedBuffer, bounds: Bounds): IndexedBuffer {
  const w = bounds.x1 - bounds.x0 + 1;
  const h = bounds.y1 - bounds.y0 + 1;
  const out = createBuffer(w, h);
  for (let y = 0; y < h; y++) {
    const from = (bounds.y0 + y) * b.w + bounds.x0;
    out.px.set(b.px.subarray(from, from + w), y * w);
  }
  return out;
}

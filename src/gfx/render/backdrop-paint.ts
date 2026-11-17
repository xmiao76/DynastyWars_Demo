/** Shared helpers for painting backdrops with crisp, un-antialiased rectangles. */

export type Paint = CanvasRenderingContext2D;

export interface Layer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: Paint;
}

export function makeLayer(w: number, h: number): Layer {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.');
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

export function fill(ctx: Paint, color: string, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Stable pseudo-random value in [0, 1) for a given number: same input, same output. */
export function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** A filled disc built from pixel rows. */
export function disc(ctx: Paint, color: string, cx: number, cy: number, r: number): void {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    ctx.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
  }
}

/** A one-pixel line drawn as individual pixels (no anti-aliasing). */
export function line(ctx: Paint, color: string, x0: number, y0: number, x1: number, y1: number): void {
  ctx.fillStyle = color;
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    ctx.fillRect(Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), 1, 1);
  }
}

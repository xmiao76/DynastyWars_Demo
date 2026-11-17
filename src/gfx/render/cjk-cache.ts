/**
 * Chinese text on the pixel grid without shipping a font: each character is
 * rasterized large with a system CJK font, then reduced to crisp 1-bit pixels
 * by coverage threshold and cached. If the machine has no CJK font the game
 * simply shows the English half of each label.
 */
const FONT_STACK =
  '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", "WenQuanYi Micro Hei", sans-serif';
const OVERSAMPLE = 4;
const COVERAGE_THRESHOLD = 0.4;
const SMALL_SIZE_LIMIT = 16;
const PROBE_CHAR = '关';
const MISSING_CHAR = String.fromCharCode(0xffff);
const PROBE_SIZE = 16;
const OPAQUE = 255;

export type Bitmap = { readonly size: number; readonly bits: Uint8Array };

const bitmaps = new Map<string, Bitmap>();
const tinted = new Map<string, HTMLCanvasElement>();
let available: boolean | null = null;

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.');
  return ctx;
}

function rasterize(ch: string, size: number): Bitmap {
  const big = size * OVERSAMPLE;
  const canvas = document.createElement('canvas');
  canvas.width = big;
  canvas.height = big;
  const ctx = context(canvas);
  const weight = size <= SMALL_SIZE_LIMIT ? 500 : 800;
  ctx.font = `${weight} ${Math.round(big * 0.92)}px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(ch, big / 2, big / 2 + big * 0.04);
  const data = ctx.getImageData(0, 0, big, big).data;
  const bits = new Uint8Array(size * size);
  const full = OVERSAMPLE * OVERSAMPLE * 255;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0;
      for (let sy = 0; sy < OVERSAMPLE; sy++) {
        for (let sx = 0; sx < OVERSAMPLE; sx++) {
          sum += data[((y * OVERSAMPLE + sy) * big + x * OVERSAMPLE + sx) * 4 + 3];
        }
      }
      bits[y * size + x] = sum / full >= COVERAGE_THRESHOLD ? 1 : 0;
    }
  }
  return { size, bits };
}

function bitmapOf(ch: string, size: number): Bitmap {
  const key = `${ch}|${size}`;
  let bitmap = bitmaps.get(key);
  if (!bitmap) {
    bitmap = rasterize(ch, size);
    bitmaps.set(key, bitmap);
  }
  return bitmap;
}

function sameBits(a: Bitmap, b: Bitmap): boolean {
  return a.bits.every((bit, i) => bit === b.bits[i]);
}

/** True if this machine can draw Chinese characters (checked once). */
export function cjkAvailable(): boolean {
  if (available !== null) return available;
  try {
    const probe = bitmapOf(PROBE_CHAR, PROBE_SIZE);
    const missing = bitmapOf(MISSING_CHAR, PROBE_SIZE);
    available = probe.bits.some((bit) => bit === 1) && !sameBits(probe, missing);
  } catch {
    available = false;
  }
  return available;
}

/** A character as a small canvas in the given colour, cached. */
export function cjkGlyph(ch: string, size: number, color: string): HTMLCanvasElement {
  const key = `${ch}|${size}|${color}`;
  const cached = tinted.get(key);
  if (cached) return cached;
  const bitmap = bitmapOf(ch, size);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = context(canvas);
  const image = ctx.createImageData(size, size);
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) throw new Error('Canvas 2D is not available in this browser.');
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  bitmap.bits.forEach((bit, i) => {
    if (!bit) return;
    image.data[i * 4] = r;
    image.data[i * 4 + 1] = g;
    image.data[i * 4 + 2] = b;
    image.data[i * 4 + 3] = OPAQUE;
  });
  ctx.putImageData(image, 0, 0);
  tinted.set(key, canvas);
  return canvas;
}

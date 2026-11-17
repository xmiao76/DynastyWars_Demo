import { clearBuffer, getPx, type IndexedBuffer } from './indexed-buffer';

function touchesInk(b: IndexedBuffer, x: number, y: number): boolean {
  return getPx(b, x - 1, y) !== 0 || getPx(b, x + 1, y) !== 0 || getPx(b, x, y - 1) !== 0 || getPx(b, x, y + 1) !== 0;
}

/**
 * Lay a freshly drawn body part over the figure. Where the part overlaps what
 * is already there, a one-pixel dark line is left around it, which is what
 * makes an arm read as lying across a torso. The part buffer is cleared.
 */
export function layer(main: IndexedBuffer, part: IndexedBuffer, lineColor: number): void {
  const { w, h } = main;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const color = part.px[i];
      if (color !== 0) main.px[i] = color;
      else if (main.px[i] !== 0 && touchesInk(part, x, y)) main.px[i] = lineColor;
    }
  }
  clearBuffer(part);
}

/** Trace the silhouette: every transparent pixel next to ink becomes the outline colour. */
export function outline(b: IndexedBuffer, color: number): void {
  const { w, h } = b;
  const marks: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (b.px[y * w + x] === 0 && touchesInk(b, x, y)) marks.push(y * w + x);
    }
  }
  for (const i of marks) b.px[i] = color;
}

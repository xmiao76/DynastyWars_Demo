import { setPx, type IndexedBuffer } from './indexed-buffer';

/** Three palette indices: shadow, midtone, highlight. */
export type Ramp = readonly [number, number, number];

// Light comes from the upper front.
const LIGHT_X = 0.5;
const LIGHT_Y = -0.86;
const HIGHLIGHT_AT = 0.38;
const SHADOW_AT = -0.28;
const MIN_SHADE_RADIUS = 0.75;
const DEG = Math.PI / 180;

function shade(nx: number, ny: number, ramp: Ramp): number {
  const lit = nx * LIGHT_X + ny * LIGHT_Y;
  if (lit > HIGHLIGHT_AT) return ramp[2];
  return lit < SHADOW_AT ? ramp[0] : ramp[1];
}

/** A rounded limb: a line segment with a (possibly different) radius at each end, shaded like a cylinder. */
export function capsule(
  b: IndexedBuffer,
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number,
  ramp: Ramp,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy || 1e-6;
  const rMax = Math.max(r0, r1);
  const minX = Math.floor(Math.min(x0, x1) - rMax);
  const maxX = Math.ceil(Math.max(x0, x1) + rMax);
  const minY = Math.floor(Math.min(y0, y1) - rMax);
  const maxY = Math.ceil(Math.max(y0, y1) + rMax);
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const t = Math.min(1, Math.max(0, ((px - x0) * dx + (py - y0) * dy) / len2));
      const r = r0 + (r1 - r0) * t;
      const ex = px - (x0 + dx * t);
      const ey = py - (y0 + dy * t);
      if (ex * ex + ey * ey > r * r) continue;
      const inv = 1 / Math.max(r, MIN_SHADE_RADIUS);
      setPx(b, px, py, shade(ex * inv, ey * inv, ramp));
    }
  }
}

/** A capsule in one flat colour (shafts, strings, straps). */
export function stroke(b: IndexedBuffer, x0: number, y0: number, x1: number, y1: number, r: number, color: number): void {
  capsule(b, x0, y0, r, x1, y1, r, [color, color, color]);
}

export function ellipse(b: IndexedBuffer, cx: number, cy: number, rx: number, ry: number, ramp: Ramp): void {
  for (let py = Math.floor(cy - ry); py <= Math.ceil(cy + ry); py++) {
    for (let px = Math.floor(cx - rx); px <= Math.ceil(cx + rx); px++) {
      const nx = (px - cx) / rx;
      const ny = (py - cy) / ry;
      if (nx * nx + ny * ny > 1) continue;
      setPx(b, px, py, shade(nx, ny, ramp));
    }
  }
}

/** Fill a polygon given as flat [x0, y0, x1, y1, ...] with one colour (even-odd scanline). */
export function poly(b: IndexedBuffer, pts: readonly number[], color: number): void {
  const n = pts.length / 2;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    minY = Math.min(minY, pts[i * 2 + 1]);
    maxY = Math.max(maxY, pts[i * 2 + 1]);
  }
  for (let py = Math.ceil(minY); py <= Math.floor(maxY); py++) {
    const xs: number[] = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ay = pts[i * 2 + 1];
      const by = pts[j * 2 + 1];
      if ((ay <= py && by > py) || (by <= py && ay > py)) {
        xs.push(pts[i * 2] + ((py - ay) / (by - ay)) * (pts[j * 2] - pts[i * 2]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let px = Math.ceil(xs[k]); px <= Math.floor(xs[k + 1]); px++) setPx(b, px, py, color);
    }
  }
}

export function rect(b: IndexedBuffer, x: number, y: number, w: number, h: number, color: number): void {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) setPx(b, px, py, color);
  }
}

/** Hand-drawn pixel art: rows of characters mapped to palette indices through a legend. */
export interface Stamp {
  readonly rows: readonly string[];
  /** Anchor inside the grid (for heads: the neck). */
  readonly ax: number;
  readonly ay: number;
}

export function stamp(b: IndexedBuffer, x: number, y: number, art: Stamp, legend: Readonly<Record<string, number>>): void {
  const left = Math.round(x) - art.ax;
  const top = Math.round(y) - art.ay;
  art.rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const color = legend[row[rx]];
      if (color) setPx(b, left + rx, top + ry, color);
    }
  });
}

/** Unit vector for a body angle: 0 = straight down, 90 = forward, 180 = straight up. */
export function dirOf(angleDeg: number): readonly [number, number] {
  return [Math.sin(angleDeg * DEG), Math.cos(angleDeg * DEG)];
}

/**
 * The crescent a blade leaves behind during a swing: the area swept between
 * two weapon angles around a pivot, thin at the start and full at the end.
 */
export function smearArc(
  b: IndexedBuffer,
  cx: number,
  cy: number,
  from: number,
  to: number,
  rInner: number,
  rOuter: number,
  edgeColor: number,
  bodyColor: number,
): void {
  const span = Math.abs(to - from);
  const turn = to >= from ? 1 : -1;
  for (let py = Math.floor(cy - rOuter); py <= Math.ceil(cy + rOuter); py++) {
    for (let px = Math.floor(cx - rOuter); px <= Math.ceil(cx + rOuter); px++) {
      const dx = px - cx;
      const dy = py - cy;
      const r = Math.hypot(dx, dy);
      if (r > rOuter || r < rInner) continue;
      const angle = Math.atan2(dx, dy) / DEG;
      const swept = ((((angle - from) * turn) % 360) + 360) % 360;
      if (swept > span) continue;
      const t = swept / span;
      const inner = rOuter - (rOuter - rInner) * t * t;
      if (r < inner) continue;
      setPx(b, px, py, r > rOuter - 2 || t > 0.9 ? edgeColor : bodyColor);
    }
  }
}

/** Half of a flattened ring, used for horizontal spinning slashes. `front` picks the near half. */
export function ringArc(
  b: IndexedBuffer,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  thickness: number,
  front: boolean,
  color: number,
): void {
  const rxIn = rx - thickness * 2;
  const ryIn = Math.max(1, ry - thickness);
  for (let py = Math.floor(cy - ry); py <= Math.ceil(cy + ry); py++) {
    if (front ? py < cy : py >= cy) continue;
    for (let px = Math.floor(cx - rx); px <= Math.ceil(cx + rx); px++) {
      const ox = (px - cx) / rx;
      const oy = (py - cy) / ry;
      const ix = (px - cx) / rxIn;
      const iy = (py - cy) / ryIn;
      if (ox * ox + oy * oy <= 1 && ix * ix + iy * iy > 1) setPx(b, px, py, color);
    }
  }
}

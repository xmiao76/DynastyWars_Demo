import { SCREEN_W } from '../../data/tuning';
import { disc, fill, hash, makeLayer, type Layer, type Paint } from './backdrop-paint';

export const HORIZON = 92;

export interface FlameSpot {
  readonly x: number;
  readonly y: number;
  readonly big: boolean;
}

const SKY_BANDS: readonly (readonly [number, string])[] = [
  [0, '#0b0a1f'],
  [24, '#110d28'],
  [42, '#1a1232'],
  [56, '#27163a'],
  [66, '#3c1a3a'],
  [74, '#5c2034'],
  [81, '#80302c'],
  [86, '#a84624'],
  [90, '#d06a20'],
];
const STAR_COUNT = 46;
const MOON_X = 306;
const MOON_Y = 25;
const MOON_R = 10;

function paintStars(ctx: Paint): void {
  for (let i = 0; i < STAR_COUNT; i++) {
    const bright = hash(i * 3.3) > 0.7;
    fill(ctx, bright ? '#e4e0f6' : '#7d78a4', hash(i) * SCREEN_W, hash(i + 50) * 52, 1, 1);
  }
}

function paintMoon(ctx: Paint): void {
  disc(ctx, '#efe6c2', MOON_X, MOON_Y, MOON_R);
  ctx.fillStyle = '#cdc59c';
  for (let dy = -MOON_R; dy <= MOON_R; dy++) {
    for (let dx = -MOON_R; dx <= MOON_R; dx++) {
      const inMoon = dx * dx + dy * dy <= MOON_R * MOON_R;
      const inLight = (dx + 3) * (dx + 3) + (dy + 3) * (dy + 3) <= MOON_R * MOON_R;
      if (inMoon && !inLight) ctx.fillRect(MOON_X + dx, MOON_Y + dy, 1, 1);
    }
  }
}

/** Columns of smoke leaning with the south-east wind that carried the fire. */
function paintSmoke(ctx: Paint): void {
  for (let plume = 0; plume < 5; plume++) {
    const baseX = 30 + plume * 78 + hash(plume) * 30;
    for (let puff = 0; puff < 7; puff++) {
      const color = puff < 3 ? '#3a1a30' : '#1c1230';
      disc(ctx, color, Math.round(baseX - puff * 9), HORIZON - 6 - puff * 11, 5 + puff * 2);
    }
  }
}

/** Night sky with a band of fire glow on the horizon. Does not scroll. */
export function paintSky(): Layer {
  const layer = makeLayer(SCREEN_W, HORIZON);
  const { ctx } = layer;
  SKY_BANDS.forEach(([y, color], i) => {
    const next = SKY_BANDS[i + 1]?.[0] ?? HORIZON;
    fill(ctx, color, 0, y, SCREEN_W, next - y);
    // Checker one row into the band above for a dithered blend.
    if (i > 0) for (let x = i & 1; x < SCREEN_W; x += 2) ctx.fillRect(x, y - 1, 1, 1);
  });
  paintStars(ctx);
  paintSmoke(ctx);
  paintMoon(ctx);
  return layer;
}

/** The cliffs themselves: a jagged silhouette, rim-lit red by the burning fleet. */
export function paintCliffs(width: number): Layer {
  const layer = makeLayer(width, HORIZON);
  const { ctx } = layer;
  for (let x = 0; x < width; x++) {
    const h = Math.round(17 + 9 * Math.sin(x * 0.021) + 6 * Math.sin(x * 0.063 + 1.3) + 4 * hash(Math.floor(x / 3)));
    const top = HORIZON - h;
    fill(ctx, '#34121e', x, top, 1, h);
    fill(ctx, '#5a1c22', x, top + 1, 1, 2);
    fill(ctx, '#9a3a26', x, top, 1, 1);
    if (hash(x * 7.7) > 0.8) fill(ctx, '#24101a', x, top + 3, 1, h - 3);
  }
  return layer;
}

const FAR_SHIP_SPACING = 168;
const FAR_HULL_Y = 100;

function paintFarShip(ctx: Paint, x: number, index: number, flames: FlameSpot[]): void {
  for (let row = 0; row < 12; row++) {
    const inset = Math.floor(row * 0.8);
    fill(ctx, row < 2 ? '#3a1c26' : '#170e20', x + inset, FAR_HULL_Y + row, 74 - inset * 2, 1);
  }
  fill(ctx, '#170e20', x + 34, FAR_HULL_Y - 34, 2, 34);
  fill(ctx, '#170e20', x + 16, FAR_HULL_Y - 30, 38, 2);
  for (let i = 0; i < 6; i++) {
    const torn = Math.floor(hash(index * 9 + i) * 10);
    fill(ctx, '#2c1a2e', x + 17 + i * 6, FAR_HULL_Y - 28, 6, 8 + torn);
  }
  if (index % 3 === 2) return;
  flames.push({ x: x + 14, y: FAR_HULL_Y + 1, big: false }, { x: x + 52, y: FAR_HULL_Y, big: index % 2 === 0 });
}

/** The rest of the chained fleet out on the river, some of it already alight. */
export function paintFarShips(width: number): { layer: Layer; flames: FlameSpot[] } {
  const layer = makeLayer(width, 128);
  const flames: FlameSpot[] = [];
  const count = Math.ceil(width / FAR_SHIP_SPACING);
  for (let i = 0; i < count; i++) {
    paintFarShip(layer.ctx, Math.round(18 + i * FAR_SHIP_SPACING + hash(i * 5.1) * 50), i, flames);
  }
  return { layer, flames };
}

const WATER_BANDS: readonly (readonly [number, string])[] = [
  [HORIZON, '#4a2030'],
  [HORIZON + 3, '#2a1a3a'],
  [HORIZON + 9, '#161a3e'],
  [HORIZON + 22, '#0f1434'],
];
const GLINT_COUNT = 30;

/** River surface with drifting reflections of the fire. */
export function drawWater(ctx: Paint, bottom: number, tick: number): void {
  WATER_BANDS.forEach(([y, color], i) => {
    const next = WATER_BANDS[i + 1]?.[0] ?? bottom;
    fill(ctx, color, 0, y, SCREEN_W, next - y);
  });
  for (let i = 0; i < GLINT_COUNT; i++) {
    const depth = hash(i * 2.7);
    const y = HORIZON + 2 + Math.floor(depth * (bottom - HORIZON - 4));
    const speed = 0.08 + hash(i) * 0.14;
    const x = (hash(i + 9) * SCREEN_W + tick * speed) % (SCREEN_W + 20);
    const lit = (tick + i * 13) % 50 < 34;
    if (!lit) continue;
    fill(ctx, depth < 0.3 ? '#e08a30' : '#8a4a3a', x - 10, y, 4 + Math.floor(hash(i + 3) * 10), 1);
  }
}

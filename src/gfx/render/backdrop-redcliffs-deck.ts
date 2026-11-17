import type { StageDef, ZBand } from '../../data/stages/types';
import { SCREEN_H } from '../../data/tuning';
import { disc, fill, hash, line, makeLayer, type Layer, type Paint } from './backdrop-paint';
import type { FlameSpot } from './backdrop-redcliffs-far';
import { cjkAvailable, cjkGlyph } from './cjk-cache';

export const RAIL_TOP = 122;
export const DECK_TOP = 148;
export const DECK_BOTTOM = 216;

const SHIP_END_GAP = 14;
const PLANK_ROW = 9;
const POST_SPACING = 46;
const MAST_XS = [300, 1210, 1640, 2150] as const;
const BURNT_FROM = 1400;
const BURNT_TO = 1800;
const PAVILION_X0 = 2462;
const PAVILION_X1 = 2706;
const WEI = '魏';

type Span = readonly [number, number];

/** Ships are the stretches of deck between the narrow crossings. */
function shipSpans(stage: StageDef): Span[] {
  const spans: Span[] = [];
  let start = 0;
  for (const band of stage.bands) {
    spans.push([start, band.x0 - SHIP_END_GAP]);
    start = band.x1 + SHIP_END_GAP;
  }
  spans.push([start, stage.width]);
  return spans;
}

function paintFloor(ctx: Paint, x0: number, x1: number): void {
  fill(ctx, '#6b4830', x0, DECK_TOP, x1 - x0, DECK_BOTTOM - DECK_TOP);
  for (let y = DECK_TOP, row = 0; y < DECK_BOTTOM; y += PLANK_ROW, row++) {
    fill(ctx, '#4e311f', x0, y, x1 - x0, 1);
    fill(ctx, '#7d573a', x0, y + 1, x1 - x0, 1);
    for (let x = x0 + ((row * 23) % 44); x < x1; x += 44) fill(ctx, '#4e311f', x, y + 1, 1, PLANK_ROW - 1);
    for (let x = x0; x < x1; x += 7) {
      if (hash(x * 1.7 + row * 31) > 0.86) fill(ctx, '#5a3b26', x, y + 3 + Math.floor(hash(x + row) * 4), 3, 1);
    }
  }
  fill(ctx, '#3e2617', x0, DECK_TOP, x1 - x0, 2);
}

function paintBulwark(ctx: Paint, x0: number, x1: number): void {
  const w = x1 - x0;
  fill(ctx, '#4b2d1f', x0, RAIL_TOP, w, DECK_TOP - RAIL_TOP);
  fill(ctx, '#38200f', x0, RAIL_TOP + 9, w, 1);
  fill(ctx, '#38200f', x0, RAIL_TOP + 18, w, 1);
  fill(ctx, '#8a5a34', x0, RAIL_TOP - 2, w, 3);
  fill(ctx, '#2e1a10', x0, RAIL_TOP + 1, w, 1);
  for (let x = x0 + 8; x < x1 - 6; x += POST_SPACING) {
    fill(ctx, '#3a2114', x, RAIL_TOP - 8, 5, DECK_TOP - RAIL_TOP + 8);
    fill(ctx, '#5c3a22', x, RAIL_TOP - 8, 1, DECK_TOP - RAIL_TOP + 8);
    fill(ctx, '#8a5a34', x - 1, RAIL_TOP - 10, 7, 2);
  }
}

function paintGunwale(ctx: Paint, x0: number, x1: number): void {
  fill(ctx, '#2e1a10', x0, DECK_BOTTOM, x1 - x0, SCREEN_H - DECK_BOTTOM);
  fill(ctx, '#8a5a34', x0, DECK_BOTTOM, x1 - x0, 2);
  fill(ctx, '#1c0f0a', x0, DECK_BOTTOM + 5, x1 - x0, 1);
}

function paintMast(ctx: Paint, x: number, burnt: boolean): void {
  const wood = burnt ? '#241a1c' : '#3f2618';
  const lit = burnt ? '#4a2a22' : '#6a4228';
  fill(ctx, wood, x, 0, 9, RAIL_TOP - 2);
  fill(ctx, lit, x, 0, 2, RAIL_TOP - 2);
  for (let y = 18; y < RAIL_TOP - 8; y += 32) fill(ctx, '#565a70', x - 1, y, 11, 2);
  fill(ctx, wood, x - 52, 30, 113, 4);
  fill(ctx, lit, x - 52, 30, 113, 1);
  for (let i = 0; i < 11; i++) {
    const sag = burnt ? Math.floor(hash(x + i) * 9) : 7 + (i % 2);
    fill(ctx, burnt ? '#3a2a2c' : '#b8a888', x - 50 + i * 10, 34, 9, sag);
    fill(ctx, burnt ? '#241a1c' : '#8c7e64', x - 50 + i * 10, 34 + sag - 1, 9, 1);
  }
  line(ctx, '#241610', x - 52, 32, x - 96, RAIL_TOP - 2);
  line(ctx, '#241610', x + 60, 32, x + 104, RAIL_TOP - 2);
}

/** Planks laid across the water between two ships, with the chains that bind the fleet. */
function paintCrossing(ctx: Paint, band: ZBand): void {
  const x0 = band.x0 - 22;
  const w = band.x1 - band.x0 + 44;
  const top = Math.round(band.zMin) - 5;
  const bottom = Math.round(band.zMax) + 7;
  fill(ctx, '#161026', x0 + 5, bottom, w - 10, 3);
  fill(ctx, '#7a5638', x0, top, w, bottom - top);
  for (let x = x0 + 4; x < x0 + w; x += PLANK_ROW) fill(ctx, '#553720', x, top + 2, 1, bottom - top - 5);
  fill(ctx, '#9a6e46', x0, top - 1, w, 1);
  fill(ctx, '#4a2c1c', x0, top, w, 2);
  fill(ctx, '#4a2c1c', x0, bottom - 3, w, 3);
  for (const base of [RAIL_TOP + 4, DECK_BOTTOM + 1]) {
    for (let i = 0; i <= w; i += 3) {
      const sag = Math.round(Math.sin((i / w) * Math.PI) * 9);
      fill(ctx, i % 6 === 0 ? '#9a9ab0' : '#4a4a60', x0 + i, base + sag, 2, 2);
    }
  }
}

/** The flagship's command pavilion: red pillars, green tiles and the banners of 魏 (Wei). */
function paintPavilion(ctx: Paint): void {
  const w = PAVILION_X1 - PAVILION_X0;
  fill(ctx, '#5e1616', PAVILION_X0, 60, w, RAIL_TOP - 60);
  fill(ctx, '#2a0c10', PAVILION_X0 + 84, 78, 76, RAIL_TOP - 78);
  fill(ctx, '#7a2a1a', PAVILION_X0 + 84, 76, 76, 2);
  for (let x = PAVILION_X0; x <= PAVILION_X1 - 8; x += 40) {
    fill(ctx, '#8c2420', x, 60, 8, RAIL_TOP - 60);
    fill(ctx, '#b84030', x, 60, 2, RAIL_TOP - 60);
  }
  fill(ctx, '#1e4a34', PAVILION_X0 - 14, 46, w + 28, 14);
  for (let x = PAVILION_X0 - 14; x < PAVILION_X1 + 14; x += 6) fill(ctx, '#2e6e4a', x, 46, 3, 12);
  fill(ctx, '#d0a030', PAVILION_X0 - 14, 58, w + 28, 2);
  fill(ctx, '#12301f', PAVILION_X0 - 14, 44, w + 28, 2);
  for (const x of [PAVILION_X0 + 24, PAVILION_X1 - 44]) {
    fill(ctx, '#4a2468', x, 64, 20, 46);
    fill(ctx, '#d0a030', x, 64, 20, 2);
    fill(ctx, '#d0a030', x, 108, 20, 2);
    if (cjkAvailable()) ctx.drawImage(cjkGlyph(WEI, 16, '#f0d060'), x + 2, 78);
  }
  // War drum on its stand
  disc(ctx, '#3a1c14', PAVILION_X0 + 122, 104, 15);
  disc(ctx, '#c8b088', PAVILION_X0 + 122, 104, 12);
  disc(ctx, '#a89068', PAVILION_X0 + 122, 104, 4);
  fill(ctx, '#3a2114', PAVILION_X0 + 106, 118, 33, 4);
}

function paintScorch(ctx: Paint): void {
  for (let i = 0; i < 26; i++) {
    const x = BURNT_FROM + hash(i * 4.1) * (BURNT_TO - BURNT_FROM);
    const y = DECK_TOP + 4 + hash(i * 9.3) * (DECK_BOTTOM - DECK_TOP - 12);
    const w = 8 + Math.floor(hash(i) * 18);
    fill(ctx, '#3c2619', x, y, w, 2);
    fill(ctx, '#2a1a12', x + 2, y + 2, w - 4, 2);
  }
}

/** The walkable layer: three chained ships and the crossings between them. Scrolls with the camera. */
export function paintDecks(stage: StageDef): { layer: Layer; flames: FlameSpot[] } {
  const layer = makeLayer(stage.width, SCREEN_H);
  const { ctx } = layer;
  for (const x of MAST_XS) paintMast(ctx, x, x > BURNT_FROM && x < BURNT_TO);
  paintPavilion(ctx);
  for (const [x0, x1] of shipSpans(stage)) {
    paintBulwark(ctx, x0, x1);
    paintFloor(ctx, x0, x1);
    paintGunwale(ctx, x0, x1);
  }
  paintScorch(ctx);
  for (const band of stage.bands) paintCrossing(ctx, band);
  const rail = RAIL_TOP - 2;
  const flames: FlameSpot[] = [
    { x: 46, y: rail, big: true },
    { x: 1470, y: rail, big: true },
    { x: 1566, y: rail, big: false },
    { x: 1640, y: 34, big: true },
    { x: 1726, y: rail, big: true },
    { x: 2742, y: rail, big: true },
  ];
  return { layer, flames };
}

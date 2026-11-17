import type { StageDef } from '../../data/stages/types';
import { SCREEN_H, SCREEN_W } from '../../data/tuning';
import { disc, makeLayer, type Paint } from './backdrop-paint';
import { paintDecks } from './backdrop-redcliffs-deck';
import { drawWater, paintCliffs, paintFarShips, paintSky, type FlameSpot } from './backdrop-redcliffs-far';
import type { MiscSprites } from './misc-sprites';

const CLIFF_PARALLAX = 0.12;
const SHIP_PARALLAX = 0.3;
const FLAME_FRAME_TICKS = 6;
const GLOW_SIZE = 72;
const GLOW_RINGS = [35, 30, 25, 20, 15, 10] as const;

export interface Backdrop {
  draw(ctx: Paint, cameraX: number, tick: number): void;
}

/** A soft additive halo drawn behind flames. */
function buildGlow(): HTMLCanvasElement {
  const { canvas, ctx } = makeLayer(GLOW_SIZE, GLOW_SIZE);
  for (const r of GLOW_RINGS) disc(ctx, 'rgba(120, 48, 10, 0.07)', GLOW_SIZE / 2, GLOW_SIZE / 2, r);
  return canvas;
}

function drawFlames(
  ctx: Paint,
  spots: readonly FlameSpot[],
  offset: number,
  tick: number,
  sprites: MiscSprites,
  glow: HTMLCanvasElement | null,
): void {
  spots.forEach((spot, i) => {
    const x = Math.round(spot.x - offset);
    if (x < -40 || x > SCREEN_W + 40) return;
    const frames = spot.big ? sprites.flame : sprites.flameSmall;
    const frame = frames[Math.floor((tick + i * 7) / FLAME_FRAME_TICKS) % frames.length];
    if (glow) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(glow, x - GLOW_SIZE / 2 + ((tick >> 2) & 1), spot.y - GLOW_SIZE / 2 - 8);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(frame.canvas, x - frame.ax, spot.y - frame.ay);
  });
}

/** 赤壁 Red Cliffs at night: sky, cliffs, river, the burning fleet, and the decks being fought over. */
export function buildRedCliffsBackdrop(stage: StageDef, sprites: MiscSprites): Backdrop {
  const scroll = stage.width - SCREEN_W;
  const sky = paintSky();
  const cliffs = paintCliffs(SCREEN_W + Math.ceil(scroll * CLIFF_PARALLAX) + 2);
  const far = paintFarShips(SCREEN_W + Math.ceil(scroll * SHIP_PARALLAX) + 2);
  const decks = paintDecks(stage);
  const glow = buildGlow();
  return {
    draw(ctx, cameraX, tick) {
      const cam = Math.floor(cameraX);
      ctx.drawImage(sky.canvas, 0, 0);
      ctx.drawImage(cliffs.canvas, -Math.floor(cam * CLIFF_PARALLAX), 0);
      drawWater(ctx, SCREEN_H, tick);
      const shipOffset = Math.floor(cam * SHIP_PARALLAX);
      ctx.drawImage(far.layer.canvas, -shipOffset, 0);
      drawFlames(ctx, far.flames, shipOffset, tick, sprites, null);
      ctx.drawImage(decks.layer.canvas, cam, 0, SCREEN_W, SCREEN_H, 0, 0, SCREEN_W, SCREEN_H);
      drawFlames(ctx, decks.flames, cam, tick, sprites, glow);
    },
  };
}

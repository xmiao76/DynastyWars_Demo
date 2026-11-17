import { SCREEN_H, SCREEN_W } from '../../data/tuning';
import { CONTROLS } from '../../data/strings';
import { drawText } from '../../gfx/render/text';

type Ctx = CanvasRenderingContext2D;

const FADE_TICKS = 18;
const FADE_STEPS = 4;
const BLINK_PERIOD = 40;
const INK = '#150d1c';
const GOLD = '#d9a030';
const CONTROL_KEY_X = 6;
const CONTROL_TEXT_X = 92;
const CONTROL_ROW = 10;

/** Darken the whole screen by a flat amount. */
export function dim(ctx: Ctx, alpha: number): void {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#07060a';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  ctx.globalAlpha = 1;
}

/** Stepped fade from black over a scene's first ticks. */
export function fadeIn(ctx: Ctx, age: number): void {
  if (age >= FADE_TICKS) return;
  const step = Math.floor((age / FADE_TICKS) * FADE_STEPS);
  dim(ctx, 1 - step / FADE_STEPS);
}

/** A bordered box for menus and cards. */
export function panel(ctx: Ctx, x: number, y: number, w: number, h: number, fillColor = '#1c1430'): void {
  ctx.fillStyle = INK;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fillColor;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
}

export function blinkOn(age: number, period = BLINK_PERIOD): boolean {
  return age % period < period * 0.6;
}

/** The control list, used on the select screen and the pause menu. */
export function drawControls(ctx: Ctx, x: number, y: number): void {
  CONTROLS.forEach(([key, action], i) => {
    drawText(ctx, key, x + CONTROL_KEY_X, y + i * CONTROL_ROW, { color: '#ffe060' });
    drawText(ctx, action, x + CONTROL_TEXT_X, y + i * CONTROL_ROW, { color: '#e8e4f0' });
  });
}

export const CONTROLS_HEIGHT = CONTROLS.length * CONTROL_ROW;

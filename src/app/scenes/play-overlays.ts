import { BOSS_CARD } from '../../data/strings';
import { SCREEN_W } from '../../data/tuning';
import { drawCjk, drawText } from '../../gfx/render/text';
import { blinkOn, CONTROLS_HEIGHT, dim, drawControls, panel } from './common';

type Ctx = CanvasRenderingContext2D;

const CENTER = SCREEN_W / 2;
const CARD_TOP = 62;
const CARD_HEIGHT = 96;

/** "WARNING — 于禁 YU JIN" card shown as the boss arrives. */
export function drawBossCard(ctx: Ctx, age: number): void {
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = '#07060a';
  ctx.fillRect(0, CARD_TOP, SCREEN_W, CARD_HEIGHT);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#b02a2a';
  ctx.fillRect(0, CARD_TOP, SCREEN_W, 2);
  ctx.fillRect(0, CARD_TOP + CARD_HEIGHT - 2, SCREEN_W, 2);
  if (blinkOn(age, 16)) drawText(ctx, 'WARNING', CENTER, 68, { align: 'center', color: '#ff5a40' });
  drawCjk(ctx, BOSS_CARD.zh, CENTER - 12, 82, { size: 40, color: '#ff8a70', shadow: '#501010', align: 'right' });
  drawText(ctx, BOSS_CARD.en, CENTER, 94, { scale: 3, shadow: '#501010' });
  drawText(ctx, BOSS_CARD.title, CENTER, 138, { align: 'center', color: '#f0d0a0' });
}

/** Continue countdown shown after the last life is lost. */
export function drawContinue(ctx: Ctx, seconds: number, age: number): void {
  dim(ctx, 0.55);
  drawText(ctx, 'CONTINUE?', CENTER, 70, { scale: 3, align: 'center', color: '#ffe060' });
  drawText(ctx, String(Math.max(0, seconds)), CENTER, 104, { scale: 4, align: 'center' });
  if (blinkOn(age, 30)) drawText(ctx, 'PRESS ENTER', CENTER, 146, { scale: 2, align: 'center', color: '#ffffff' });
}

/** Pause menu with the control list. */
export function drawPause(ctx: Ctx): void {
  dim(ctx, 0.6);
  drawText(ctx, 'PAUSED', CENTER, 34, { scale: 3, align: 'center', color: '#ffe060' });
  panel(ctx, 66, 70, 252, CONTROLS_HEIGHT + 14);
  drawControls(ctx, 66, 78);
  drawText(ctx, 'PRESS P TO RESUME', CENTER, 172, { align: 'center' });
}

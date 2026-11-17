import { CREDITS, GAME_TITLE } from '../../data/strings';
import { SCREEN_H, SCREEN_W } from '../../data/tuning';
import { frameOf } from '../../gfx/rig/atlas';
import { drawCjk, drawText, textWidth } from '../../gfx/render/text';
import { BTN } from '../../sim/types';
import type { InputFrame } from '../input/keyboard';
import type { Scene, Services } from '../services';
import { blinkOn, dim, fadeIn } from './common';
import { createSelectScene } from './select';

type Ctx = CanvasRenderingContext2D;

const PAN_START = 1180;
const PAN_SPEED = 0.15;
const PAN_RANGE = 420;
const HERO_X = 96;
const HERO_Y = 193;
/** The logo block sits right of centre, leaving room for the hero on the left. */
const LOGO_X = SCREEN_W / 2 + 30;

const FOOTER_TOP = 197;
const CREDIT_ROW = 10;
const CREDITS_PER_LINE = 2;
const CREDIT_GAP = '   ';
const LABEL_COLOR = '#a89cc8';
const VALUE_COLOR = '#ffe9a8';

/** One line of "LABEL: VALUE" pairs, centred as a whole. */
function drawCreditLine(ctx: Ctx, entries: readonly (readonly [string, string])[], y: number): void {
  const parts = entries.flatMap(([label, value], i) => [
    { text: `${i > 0 ? CREDIT_GAP : ''}${label}: `, color: LABEL_COLOR },
    { text: value, color: VALUE_COLOR },
  ]);
  const total = textWidth(parts.map((p) => p.text).join(''));
  let x = Math.round((SCREEN_W - total) / 2);
  for (const part of parts) {
    drawText(ctx, part.text, x, y, { color: part.color });
    // textWidth leaves off the gap after the last glyph; add it back so the next part starts on the grid.
    x += textWidth(part.text) + 1;
  }
}

/** Footer strip crediting the model, provider, reasoning effort and coding agent that made the demo. */
function drawCredits(ctx: Ctx): void {
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = '#07060a';
  ctx.fillRect(0, FOOTER_TOP, SCREEN_W, SCREEN_H - FOOTER_TOP);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#7a5a18';
  ctx.fillRect(0, FOOTER_TOP, SCREEN_W, 1);
  for (let i = 0; i < CREDITS.length; i += CREDITS_PER_LINE) {
    const row = i / CREDITS_PER_LINE;
    drawCreditLine(ctx, CREDITS.slice(i, i + CREDITS_PER_LINE), FOOTER_TOP + 5 + row * CREDIT_ROW);
  }
}

/** Title screen: the burning fleet drifting past behind the logo. */
export function createTitleScene(services: Services): Scene {
  let age = 0;
  const scene: Scene = {
    name: 'title',
    update(input: InputFrame): Scene {
      age += 1;
      services.audio.playSong('title');
      if (input.pressed & BTN.START) {
        services.audio.playSfx('ui_confirm');
        return createSelectScene(services);
      }
      return scene;
    },
    draw(ctx) {
      // Pan back and forth along the middle ship.
      const phase = (age * PAN_SPEED) % (PAN_RANGE * 2);
      const pan = phase < PAN_RANGE ? phase : PAN_RANGE * 2 - phase;
      services.backdrop.draw(ctx, PAN_START + pan, age);
      dim(ctx, 0.35);
      const hero = frameOf(services.atlas, 'guanyu', age % 64 < 32 ? 'idle0' : 'idle1');
      ctx.drawImage(hero.canvas, HERO_X - hero.ax, HERO_Y - hero.ay);
      drawCjk(ctx, GAME_TITLE.zh, LOGO_X, 30, { size: 40, color: '#ffd24a', shadow: '#7a1c10', align: 'center' });
      drawText(ctx, GAME_TITLE.en, LOGO_X, 82, { scale: 2, color: '#ffffff', shadow: '#7a1c10', align: 'center' });
      drawText(ctx, GAME_TITLE.tagline, LOGO_X, 104, { color: '#f0a060', align: 'center' });
      if (blinkOn(age)) drawText(ctx, GAME_TITLE.press, LOGO_X, 138, { scale: 2, color: '#ffe060', align: 'center' });
      drawText(ctx, 'ENTER START   M MUTE', LOGO_X, 168, { color: '#b8b0d0', align: 'center' });
      drawCredits(ctx);
      fadeIn(ctx, age);
    },
  };
  return scene;
}

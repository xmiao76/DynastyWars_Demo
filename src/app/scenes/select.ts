import { HERO_CARD, SPECIAL_NAME } from '../../data/strings';
import { SCREEN_H, SCREEN_W } from '../../data/tuning';
import { frameOf } from '../../gfx/rig/atlas';
import { drawCjk, drawText } from '../../gfx/render/text';
import { BTN } from '../../sim/types';
import type { InputFrame } from '../input/keyboard';
import type { Scene, Services } from '../services';
import { blinkOn, drawControls, fadeIn, panel } from './common';
import { createStageIntroScene } from './stage-intro';

const HERO_SCALE = 2;
const HERO_X = 62;
const HERO_Y = 196;
const INFO_X = 124;
const STAT_PIPS = 5;
/** A little showcase loop so the hero is seen in motion before the fight. */
const SHOWCASE: readonly string[] = ['idle0', 'idle1', 'idle0', 'idle1', 'c2_a', 'c2_b', 'c2_c', 'c2_c', 'idle0', 'idle1', 'c4_a', 'c4_b', 'c4_c', 'c4_c'];
const SHOWCASE_FRAME_TICKS = 14;

function drawStats(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  HERO_CARD.stats.forEach(([label, value], i) => {
    const rowY = y + i * 10;
    drawText(ctx, label, x, rowY, { color: '#b8b0d0' });
    for (let pip = 0; pip < STAT_PIPS; pip++) {
      ctx.fillStyle = pip < value ? '#ffe060' : '#3a3050';
      ctx.fillRect(x + 42 + pip * 9, rowY, 7, 6);
    }
  });
}

function drawHero(ctx: CanvasRenderingContext2D, services: Services, age: number): void {
  const pose = SHOWCASE[Math.floor(age / SHOWCASE_FRAME_TICKS) % SHOWCASE.length];
  const frame = frameOf(services.atlas, 'guanyu', pose);
  ctx.save();
  ctx.beginPath();
  ctx.rect(9, 21, 108, 184);
  ctx.clip();
  ctx.drawImage(frame.canvas, HERO_X - frame.ax * HERO_SCALE, HERO_Y - frame.ay * HERO_SCALE, frame.w * HERO_SCALE, frame.h * HERO_SCALE);
  ctx.restore();
}

/** Hero select. The demo has one hero, so this doubles as his introduction and move list. */
export function createSelectScene(services: Services): Scene {
  let age = 0;
  const scene: Scene = {
    name: 'select',
    update(input: InputFrame): Scene {
      age += 1;
      if (age > 10 && input.pressed & BTN.START) {
        services.audio.playSfx('ui_confirm');
        return createStageIntroScene(services);
      }
      return scene;
    },
    draw(ctx) {
      ctx.fillStyle = '#120c20';
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      drawText(ctx, 'SELECT YOUR HERO', SCREEN_W / 2, 6, { align: 'center', color: '#ffe060' });
      panel(ctx, 8, 20, 110, 186, '#241a3a');
      drawHero(ctx, services, age);
      drawText(ctx, 'DEMO: 1 HERO', 63, 24, { align: 'center', color: '#8a80a8' });

      panel(ctx, INFO_X, 20, 252, 100);
      drawCjk(ctx, HERO_CARD.zh, INFO_X + 6, 25, { size: 24, color: '#ffd24a' });
      drawText(ctx, HERO_CARD.en, INFO_X + 62, 30, { scale: 2 });
      drawCjk(ctx, HERO_CARD.weaponZh, INFO_X + 6, 53, { color: '#8fd0a0' });
      drawText(ctx, HERO_CARD.weaponEn, INFO_X + 6, 72, { color: '#8fd0a0' });
      HERO_CARD.bio.forEach((text, i) => drawText(ctx, text, INFO_X + 6, 84 + i * 9, { color: '#d8d0e8' }));
      drawStats(ctx, INFO_X + 160, 26);
      drawCjk(ctx, SPECIAL_NAME.zh, INFO_X + 160, 56, { color: '#9fd4f0' });
      drawText(ctx, 'J+K', INFO_X + 216, 62, { color: '#9fd4f0' });

      panel(ctx, INFO_X, 124, 252, 82);
      drawControls(ctx, INFO_X, 131);
      if (blinkOn(age)) drawText(ctx, 'PRESS ENTER TO BEGIN', SCREEN_W / 2, 212, { align: 'center', color: '#ffe060' });
      fadeIn(ctx, age);
    },
  };
  return scene;
}

import { GAME_OVER_TEXT } from '../../data/strings';
import { SCREEN_H, SCREEN_W } from '../../data/tuning';
import { drawCjk, drawText } from '../../gfx/render/text';
import { BTN } from '../../sim/types';
import type { InputFrame } from '../input/keyboard';
import type { Scene, Services } from '../services';
import { blinkOn, fadeIn } from './common';
import { createTitleScene } from './title';

const ACCEPT_AFTER = 90;
const CENTER = SCREEN_W / 2;

/** Game over: a line of consolation, the final score, and a way back to the title. */
export function createGameOverScene(services: Services, score: number): Scene {
  let age = 0;
  services.audio.playSong('gameover');
  const scene: Scene = {
    name: 'gameover',
    update(input: InputFrame): Scene {
      age += 1;
      if (age > ACCEPT_AFTER && input.pressed & BTN.START) {
        services.audio.playSfx('ui_confirm');
        return createTitleScene(services);
      }
      return scene;
    },
    draw(ctx) {
      ctx.fillStyle = '#0c0814';
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      drawText(ctx, GAME_OVER_TEXT.en, CENTER, 50, { scale: 4, align: 'center', color: '#e85a40', shadow: '#501010' });
      drawCjk(ctx, GAME_OVER_TEXT.proverbZh, CENTER, 100, { color: '#f0d0a0', align: 'center' });
      drawText(ctx, GAME_OVER_TEXT.proverbEn, CENTER, 124, { align: 'center', color: '#b8b0d0' });
      drawText(ctx, `SCORE ${score}`, CENTER, 150, { scale: 2, align: 'center' });
      if (age > ACCEPT_AFTER && blinkOn(age)) drawText(ctx, 'PRESS ENTER', CENTER, 190, { align: 'center', color: '#ffe060' });
      fadeIn(ctx, age);
    },
  };
  return scene;
}

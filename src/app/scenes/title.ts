import { GAME_TITLE } from '../../data/strings';
import { SCREEN_W } from '../../data/tuning';
import { frameOf } from '../../gfx/rig/atlas';
import { drawCjk, drawText } from '../../gfx/render/text';
import { BTN } from '../../sim/types';
import type { InputFrame } from '../input/keyboard';
import type { Scene, Services } from '../services';
import { blinkOn, dim, fadeIn } from './common';
import { createSelectScene } from './select';

const PAN_START = 1180;
const PAN_SPEED = 0.15;
const PAN_RANGE = 420;
const HERO_X = 96;
const HERO_Y = 206;
const CENTER = SCREEN_W / 2;

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
      drawCjk(ctx, GAME_TITLE.zh, CENTER + 30, 34, { size: 40, color: '#ffd24a', shadow: '#7a1c10', align: 'center' });
      drawText(ctx, GAME_TITLE.en, CENTER + 30, 86, { scale: 2, color: '#ffffff', shadow: '#7a1c10', align: 'center' });
      drawText(ctx, GAME_TITLE.tagline, CENTER + 30, 108, { color: '#f0a060', align: 'center' });
      if (blinkOn(age)) drawText(ctx, GAME_TITLE.press, CENTER + 30, 150, { scale: 2, color: '#ffe060', align: 'center' });
      drawText(ctx, 'ENTER START   M MUTE', CENTER + 30, 208, { color: '#b8b0d0', align: 'center' });
      fadeIn(ctx, age);
    },
  };
  return scene;
}

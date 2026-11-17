import { STAGE_CARD } from '../../data/strings';
import { SCREEN_W } from '../../data/tuning';
import { drawCjk, drawText } from '../../gfx/render/text';
import { BTN } from '../../sim/types';
import type { InputFrame } from '../input/keyboard';
import type { Scene, Services } from '../services';
import { dim, fadeIn } from './common';
import { createPlayScene } from './play';

const DURATION = 230;
const SKIP_AFTER = 30;
const CENTER = SCREEN_W / 2;
const HORN_AT = 12;

/** "第一关 STAGE 1 · 赤壁 RED CLIFFS" card shown before the fight. */
export function createStageIntroScene(services: Services): Scene {
  let age = 0;
  services.audio.playSong(null);
  const scene: Scene = {
    name: 'stage-intro',
    update(input: InputFrame): Scene {
      age += 1;
      if (age === HORN_AT) services.audio.playSfx('war_horn');
      const skip = age > SKIP_AFTER && (input.pressed & BTN.START) !== 0;
      return age >= DURATION || skip ? createPlayScene(services) : scene;
    },
    draw(ctx) {
      services.backdrop.draw(ctx, 0, age);
      dim(ctx, 0.72);
      drawCjk(ctx, STAGE_CARD.numberZh, CENTER - 8, 24, { size: 24, color: '#f0a060', align: 'right' });
      drawText(ctx, STAGE_CARD.numberEn, CENTER + 4, 30, { scale: 2, color: '#f0a060' });
      drawCjk(ctx, STAGE_CARD.zh, CENTER, 60, { size: 48, color: '#ffd24a', shadow: '#7a1c10', align: 'center' });
      drawText(ctx, STAGE_CARD.en, CENTER, 118, { scale: 3, color: '#ffffff', shadow: '#7a1c10', align: 'center' });
      STAGE_CARD.brief.forEach((text, i) => drawText(ctx, text, CENTER, 156 + i * 11, { align: 'center', color: '#d8d0e8' }));
      fadeIn(ctx, age);
    },
  };
  return scene;
}

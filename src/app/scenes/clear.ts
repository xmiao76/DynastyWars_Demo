import { CLEAR_TEXT } from '../../data/strings';
import { SCREEN_H, SCREEN_W, TICKS_PER_SECOND } from '../../data/tuning';
import { frameOf } from '../../gfx/rig/atlas';
import { drawCjk, drawText } from '../../gfx/render/text';
import { BTN } from '../../sim/types';
import type { InputFrame } from '../input/keyboard';
import type { Scene, Services } from '../services';
import { blinkOn, fadeIn, panel } from './common';
import { createTitleScene } from './title';

export interface RunSummary {
  readonly score: number;
  readonly kos: number;
  readonly ticks: number;
  readonly continues: number;
}

const LINE_INTERVAL = 42;
const FIRST_LINE_AT = 70;
const PAR_SECONDS = 420;
const TIME_BONUS_PER_SECOND = 40;
const NO_CONTINUE_BONUS = 10000;
const HERO_SCALE = 2;
const LABEL_X = 150;
const VALUE_X = 366;

function formatTime(ticks: number): string {
  const seconds = Math.floor(ticks / TICKS_PER_SECOND);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Bonuses reward a quick, clean run. */
export function tally(run: RunSummary): { timeBonus: number; cleanBonus: number; total: number; rank: string } {
  const seconds = Math.floor(run.ticks / TICKS_PER_SECOND);
  const timeBonus = Math.max(0, PAR_SECONDS - seconds) * TIME_BONUS_PER_SECOND;
  const cleanBonus = run.continues === 0 ? NO_CONTINUE_BONUS : 0;
  const rank = run.continues > 1 ? 'C' : run.continues === 1 ? 'B' : seconds <= PAR_SECONDS ? 'S' : 'A';
  return { timeBonus, cleanBonus, total: run.score + timeBonus + cleanBonus, rank };
}

/** Stage clear: the score tally, then back to the title. */
export function createClearScene(services: Services, run: RunSummary): Scene {
  const result = tally(run);
  const lines: readonly (readonly [string, string])[] = [
    ['SCORE', String(run.score)],
    ['FOES DEFEATED', String(run.kos)],
    ['TIME', formatTime(run.ticks)],
    ['TIME BONUS', String(result.timeBonus)],
    ['NO-CONTINUE BONUS', String(result.cleanBonus)],
    ['TOTAL', String(result.total)],
  ];
  const allShownAt = FIRST_LINE_AT + lines.length * LINE_INTERVAL;
  let age = 0;
  services.audio.playSong('clear');
  const scene: Scene = {
    name: 'clear',
    update(input: InputFrame): Scene {
      age += 1;
      const sinceFirst = age - FIRST_LINE_AT;
      if (sinceFirst >= 0 && sinceFirst % LINE_INTERVAL === 0 && sinceFirst / LINE_INTERVAL < lines.length) {
        services.audio.playSfx('tally');
      }
      if (age > allShownAt && input.pressed & BTN.START) {
        services.audio.playSfx('ui_confirm');
        return createTitleScene(services);
      }
      return scene;
    },
    draw(ctx) {
      ctx.fillStyle = '#120c20';
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      drawCjk(ctx, CLEAR_TEXT.zh, 150, 8, { size: 32, color: '#ffd24a', shadow: '#7a1c10' });
      drawText(ctx, CLEAR_TEXT.en, 222, 16, { scale: 2, color: '#ffffff', shadow: '#7a1c10' });
      panel(ctx, 8, 8, 128, 200, '#241a3a');
      const hero = frameOf(services.atlas, 'guanyu', 'win');
      ctx.drawImage(hero.canvas, 66 - hero.ax * HERO_SCALE, 200 - hero.ay * HERO_SCALE, hero.w * HERO_SCALE, hero.h * HERO_SCALE);
      const shown = Math.max(0, Math.floor((age - FIRST_LINE_AT) / LINE_INTERVAL) + 1);
      lines.slice(0, shown).forEach(([label, value], i) => {
        const y = 56 + i * 16;
        const isTotal = i === lines.length - 1;
        drawText(ctx, label, LABEL_X, y, { color: isTotal ? '#ffe060' : '#d8d0e8' });
        drawText(ctx, value, VALUE_X, y, { align: 'right', color: isTotal ? '#ffe060' : '#ffffff' });
      });
      if (age > allShownAt) {
        drawText(ctx, `RANK ${result.rank}`, 258, 156, { scale: 2, align: 'center', color: '#9fd4f0' });
        drawText(ctx, CLEAR_TEXT.thanks, 258, 184, { align: 'center', color: '#f0a060' });
        if (blinkOn(age)) drawText(ctx, 'PRESS ENTER', 258, 200, { align: 'center', color: '#ffffff' });
      }
      fadeIn(ctx, age);
    },
  };
  return scene;
}

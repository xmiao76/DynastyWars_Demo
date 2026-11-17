import { box } from '../../core/math';
import { F_ARMOR, type MoveDef } from '../../sim/types';
import { flinch, knockdown } from './build';

/** Wei rank and file. Every attack opens with a readable wind-up frame. */
export const ENEMY_MOVES: readonly MoveDef[] = [
  {
    // 刀兵 Sword Soldier: quick slash
    id: 'sw_atk',
    frames: [
      { ticks: 18, pose: 'atk_a' },
      { ticks: 4, pose: 'atk_b', dx: 5, sfx: 'swing_light', hit: flinch(box(4, 36, 14, 46), 6, { stun: 16, kbx: 1.4 }) },
      { ticks: 24, pose: 'atk_c' },
    ],
  },
  {
    // 枪兵 Spearman: long, narrow thrust
    id: 'sp_atk',
    frames: [
      { ticks: 22, pose: 'atk_a' },
      {
        ticks: 5,
        pose: 'atk_b',
        dx: 6,
        sfx: 'swing_light',
        hit: flinch(box(8, 56, 18, 38), 8, { z: 8, stun: 18, kbx: 1.8 }),
      },
      { ticks: 28, pose: 'atk_c' },
    ],
  },
  {
    // 弓兵 Archer: draw, then loose an arrow down the lane
    id: 'ar_atk',
    frames: [
      { ticks: 34, pose: 'atk_a' },
      { ticks: 4, pose: 'atk_b', effect: 'arrow', sfx: 'arrow_shoot' },
      { ticks: 26, pose: 'atk_c' },
    ],
  },
  {
    // 力士 Brute: armoured shoulder charge
    id: 'br_atk',
    frames: [
      { ticks: 28, pose: 'atk_a', flags: F_ARMOR, sfx: 'telegraph' },
      {
        ticks: 18,
        pose: 'atk_b',
        dx: 78,
        flags: F_ARMOR,
        sfx: 'dash',
        hit: knockdown(box(-2, 30, 4, 54), 14, { spark: 'blunt', kbx: 4, kby: 4.2 }),
      },
      { ticks: 44, pose: 'atk_c' },
    ],
  },
];

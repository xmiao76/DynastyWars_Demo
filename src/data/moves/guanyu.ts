import { box } from '../../core/math';
import { F_CANCEL, F_HOLD_AIR, F_INVULN, F_REHIT, type MoveDef } from '../../sim/types';
import { flinch, knockdown } from './build';

const HOLD = 99;
const SPIN_BOX = box(-60, 60, 0, 58);
const SPIN_Z = 18;

/** 关羽 Guan Yu: long reach with the Green Dragon Crescent Blade. */
export const GUANYU_MOVES: readonly MoveDef[] = [
  {
    id: 'gy_c1',
    chain: 'gy_c2',
    frames: [
      { ticks: 4, pose: 'c1_a' },
      { ticks: 4, pose: 'c1_b', dx: 3, sfx: 'swing_light', hit: flinch(box(8, 54, 20, 46), 8, { spark: 'blunt' }) },
      { ticks: 9, pose: 'c1_b', flags: F_CANCEL },
    ],
  },
  {
    id: 'gy_c2',
    chain: 'gy_c3',
    frames: [
      { ticks: 4, pose: 'c2_a' },
      { ticks: 4, pose: 'c2_b', dx: 4, sfx: 'swing_light', hit: flinch(box(6, 60, 8, 54), 10) },
      { ticks: 10, pose: 'c2_c', flags: F_CANCEL },
    ],
  },
  {
    id: 'gy_c3',
    chain: 'gy_c4',
    frames: [
      { ticks: 5, pose: 'c3_a' },
      { ticks: 5, pose: 'c3_b', dx: 4, sfx: 'swing_light', hit: flinch(box(6, 58, 10, 70), 12, { stun: 22 }) },
      { ticks: 10, pose: 'c3_c', flags: F_CANCEL },
    ],
  },
  {
    id: 'gy_c4',
    frames: [
      { ticks: 8, pose: 'c4_a' },
      { ticks: 5, pose: 'c4_b', dx: 7, sfx: 'swing_heavy', hit: knockdown(box(4, 66, 0, 62), 20, { kbx: 3.6, kby: 4.8 }) },
      { ticks: 16, pose: 'c4_c' },
    ],
  },
  {
    id: 'gy_ja',
    air: true,
    frames: [
      { ticks: 3, pose: 'ja_a' },
      { ticks: HOLD, pose: 'ja_b', flags: F_HOLD_AIR, sfx: 'swing_heavy', hit: knockdown(box(2, 48, -8, 40), 14, { kbx: 2.6, kby: 3.6 }) },
    ],
  },
  {
    id: 'gy_jf',
    air: true,
    frames: [
      { ticks: 3, pose: 'jf_a' },
      { ticks: HOLD, pose: 'jf_b', flags: F_HOLD_AIR, sfx: 'swing_heavy', hit: knockdown(box(4, 60, -4, 38), 14) },
    ],
  },
  {
    id: 'gy_da',
    frames: [
      { ticks: 4, pose: 'da_a', dx: 10 },
      { ticks: 8, pose: 'da_b', dx: 22, sfx: 'swing_heavy', hit: knockdown(box(4, 62, 4, 46), 16, { kbx: 4, kby: 4 }) },
      { ticks: 16, pose: 'da_c', dx: 4 },
    ],
  },
  {
    id: 'gy_pm',
    frames: [
      { ticks: 5, pose: 'pm_a' },
      { ticks: 5, pose: 'pm_b', effect: 'grabHit', sfx: 'swing_light' },
      { ticks: 8, pose: 'pm_a' },
    ],
  },
  {
    id: 'gy_th',
    frames: [
      { ticks: 6, pose: 'th_a' },
      { ticks: 4, pose: 'th_b', effect: 'throw', sfx: 'throw' },
      { ticks: 14, pose: 'th_b' },
    ],
  },
  {
    // 青龙斩 Dragon Cleave: invincible spin, paid for in health when it connects.
    id: 'gy_sp',
    hpCost: 10,
    frames: [
      { ticks: 4, pose: 'sp_a', flags: F_INVULN, sfx: 'special' },
      {
        ticks: 5,
        pose: 'sp_b',
        flags: F_INVULN | F_REHIT,
        hit: knockdown(SPIN_BOX, 14, { radial: true, kbx: 3.8, kby: 5, z: SPIN_Z }),
      },
      { ticks: 5, pose: 'sp_c', flags: F_INVULN },
      {
        ticks: 5,
        pose: 'sp_d',
        flags: F_INVULN | F_REHIT,
        hit: knockdown(SPIN_BOX, 8, { radial: true, kbx: 3.8, kby: 4, z: SPIN_Z }),
      },
      { ticks: 5, pose: 'sp_c', flags: F_INVULN },
      { ticks: 12, pose: 'sp_e', flags: F_INVULN },
    ],
  },
];

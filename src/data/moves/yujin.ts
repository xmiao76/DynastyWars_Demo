import { box } from '../../core/math';
import { F_ARMOR, F_HOLD_AIR, F_INVULN, F_REHIT, type MoveDef } from '../../sim/types';
import { flinch, knockdown } from './build';

const HOLD = 99;

/**
 * 于禁 Yu Jin. Every pattern has a wind-up of at least 18 ticks and a long
 * recovery, so each one can be read, avoided and punished.
 */
export const YUJIN_MOVES: readonly MoveDef[] = [
  {
    // Two-hit sabre string: stagger, then a launching cut
    id: 'yj_sabre',
    frames: [
      { ticks: 18, pose: 's1a', sfx: 'telegraph' },
      { ticks: 4, pose: 's1b', dx: 7, sfx: 'swing_light', hit: flinch(box(6, 46, 10, 52), 10, { stun: 20 }) },
      { ticks: 8, pose: 's1c' },
      { ticks: 9, pose: 's2a' },
      { ticks: 5, pose: 's2b', dx: 9, sfx: 'swing_heavy', flags: F_REHIT, hit: knockdown(box(6, 52, 2, 58), 14) },
      { ticks: 34, pose: 's2c' },
    ],
  },
  {
    // Lane-locked charge across the deck: sidestep it, punish the recovery
    id: 'yj_charge',
    frames: [
      { ticks: 30, pose: 'ch_a', flags: F_ARMOR, sfx: 'boss_roar' },
      {
        ticks: 26,
        pose: 'ch_b',
        dx: 208,
        flags: F_ARMOR,
        sfx: 'dash',
        hit: knockdown(box(0, 40, 4, 52), 16, { z: 10, kbx: 4.4, kby: 4.6 }),
      },
      { ticks: 52, pose: 'ch_c' },
    ],
  },
  {
    // Leaping cleave onto the player's position
    id: 'yj_leap',
    frames: [
      { ticks: 20, pose: 'lp_a', flags: F_ARMOR, sfx: 'telegraph' },
      { ticks: HOLD, pose: 'lp_b', flags: F_ARMOR | F_HOLD_AIR, effect: 'leap', sfx: 'jump' },
      {
        ticks: 6,
        pose: 'lp_c',
        effect: 'shake',
        sfx: 'body_fall',
        hit: knockdown(box(-42, 42, 0, 40), 18, { radial: true, z: 16, spark: 'blunt' }),
      },
      { ticks: 38, pose: 'lp_d' },
    ],
  },
  {
    // Raises the command flag: reinforcements and an arrow volley
    id: 'yj_flag',
    frames: [
      { ticks: 46, pose: 'fl', flags: F_INVULN, effect: 'summon', sfx: 'war_horn' },
      { ticks: 16, pose: 'fl', flags: F_INVULN },
    ],
  },
  {
    // Guard burst: shoves the player off so he cannot be stun-locked
    id: 'yj_burst',
    frames: [
      { ticks: 5, pose: 'bu_a', flags: F_INVULN, sfx: 'boss_roar' },
      {
        ticks: 6,
        pose: 'bu_b',
        flags: F_INVULN,
        hit: knockdown(box(-44, 44, 0, 58), 6, { radial: true, z: 18, spark: 'blunt', kbx: 4.2, kby: 3.8 }),
      },
      { ticks: 26, pose: 'bu_b' },
    ],
  },
];

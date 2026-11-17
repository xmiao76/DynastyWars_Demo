import { box, type Box } from '../core/math';
import type { FighterKind, MoveId, Team } from '../sim/types';

export type AiType = 'melee' | 'ranged' | 'boss';

export interface AiProfile {
  readonly type: AiType;
  readonly attack: MoveId;
  /** Farthest and nearest horizontal distance the attack is started from. */
  readonly range: number;
  readonly minRange: number;
  /** How closely the enemy must line up in depth before attacking. */
  readonly zTol: number;
  /** Distance range kept from the player while waiting for a turn. */
  readonly hold: readonly [number, number];
  /** Ticks of rest after an attack. */
  readonly cool: readonly [number, number];
  /** Boss only: counter used when the player lands too many staggering hits in a row. */
  readonly burst?: MoveId;
}

export interface MoveSet {
  readonly combo?: MoveId;
  readonly jumpNeutral?: MoveId;
  readonly jumpForward?: MoveId;
  readonly dashAttack?: MoveId;
  readonly pummel?: MoveId;
  readonly throw?: MoveId;
  readonly special?: MoveId;
}

export interface FighterDef {
  readonly kind: FighterKind;
  readonly nameZh: string;
  readonly nameEn: string;
  readonly team: Team;
  readonly maxHp: number;
  readonly speed: number;
  readonly speedZ: number;
  readonly dashSpeed: number;
  readonly jumpV: number;
  readonly hurtBox: Box;
  /** Height at which hit sparks appear. */
  readonly chestHeight: number;
  readonly grabbable: boolean;
  readonly score: number;
  readonly moves: MoveSet;
  readonly ai?: AiProfile;
}

export const FIGHTERS: Readonly<Record<FighterKind, FighterDef>> = {
  guanyu: {
    kind: 'guanyu',
    nameZh: '关羽',
    nameEn: 'GUAN YU',
    team: 'player',
    maxHp: 100,
    speed: 1.5,
    speedZ: 1,
    dashSpeed: 2.9,
    jumpV: 7,
    hurtBox: box(-9, 9, 0, 56),
    chestHeight: 36,
    grabbable: false,
    score: 0,
    moves: {
      combo: 'gy_c1',
      jumpNeutral: 'gy_ja',
      jumpForward: 'gy_jf',
      dashAttack: 'gy_da',
      pummel: 'gy_pm',
      throw: 'gy_th',
      special: 'gy_sp',
    },
  },
  sword: {
    kind: 'sword',
    nameZh: '刀兵',
    nameEn: 'SWORDSMAN',
    team: 'enemy',
    maxHp: 40,
    speed: 0.85,
    speedZ: 0.6,
    dashSpeed: 0,
    jumpV: 0,
    hurtBox: box(-8, 8, 0, 48),
    chestHeight: 32,
    grabbable: true,
    score: 200,
    moves: {},
    ai: { type: 'melee', attack: 'sw_atk', range: 34, minRange: 0, zTol: 5, hold: [56, 86], cool: [70, 150] },
  },
  spear: {
    kind: 'spear',
    nameZh: '枪兵',
    nameEn: 'SPEARMAN',
    team: 'enemy',
    maxHp: 46,
    speed: 0.75,
    speedZ: 0.55,
    dashSpeed: 0,
    jumpV: 0,
    hurtBox: box(-8, 8, 0, 48),
    chestHeight: 32,
    grabbable: true,
    score: 300,
    moves: {},
    ai: { type: 'melee', attack: 'sp_atk', range: 54, minRange: 22, zTol: 4, hold: [72, 98], cool: [90, 170] },
  },
  archer: {
    kind: 'archer',
    nameZh: '弓兵',
    nameEn: 'ARCHER',
    team: 'enemy',
    maxHp: 30,
    speed: 0.9,
    speedZ: 0.65,
    dashSpeed: 0,
    jumpV: 0,
    hurtBox: box(-7, 7, 0, 46),
    chestHeight: 30,
    grabbable: true,
    score: 300,
    moves: {},
    ai: { type: 'ranged', attack: 'ar_atk', range: 200, minRange: 70, zTol: 4, hold: [120, 165], cool: [120, 200] },
  },
  brute: {
    kind: 'brute',
    nameZh: '力士',
    nameEn: 'BRUTE',
    team: 'enemy',
    maxHp: 110,
    speed: 0.6,
    speedZ: 0.45,
    dashSpeed: 0,
    jumpV: 0,
    hurtBox: box(-11, 11, 0, 58),
    chestHeight: 38,
    grabbable: false,
    score: 800,
    moves: {},
    ai: { type: 'melee', attack: 'br_atk', range: 88, minRange: 30, zTol: 6, hold: [84, 112], cool: [130, 220] },
  },
  yujin: {
    kind: 'yujin',
    nameZh: '于禁',
    nameEn: 'YU JIN',
    team: 'enemy',
    maxHp: 520,
    speed: 1,
    speedZ: 0.75,
    dashSpeed: 0,
    jumpV: 0,
    hurtBox: box(-10, 10, 0, 62),
    chestHeight: 40,
    grabbable: false,
    score: 5000,
    moves: {},
    ai: {
      type: 'boss',
      attack: 'yj_sabre',
      range: 40,
      minRange: 0,
      zTol: 5,
      hold: [70, 110],
      cool: [40, 70],
      burst: 'yj_burst',
    },
  },
};

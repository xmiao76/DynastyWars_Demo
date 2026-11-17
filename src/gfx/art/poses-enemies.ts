import type { ArcSmear, Pose } from '../rig/pose';
import { commonPoses, type PoseTable } from './poses-common';

const FEET = { footN: [-5, 0], footF: [6, 0] } as const;
const WIDE = { footN: [-7, 0], footF: [7, 0] } as const;
const LUNGE = { footN: [-9, 0], footF: [10, 0] } as const;

function swing(from: number, to: number, inner: number, outer: number): ArcSmear {
  return { kind: 'arc', from, to, inner, outer };
}

// ------------------------------------------------------------------ 刀兵 Sword Soldier
const SWORD_STANCE: Pose = { lean: 4, armN: [35, 75], armF: [10, 30], weapon: 150, ...FEET };
const SWORD_LOOSE: Pose = { armN: [-40, 40], armF: [50, 40], weapon: 200, ...FEET };
const SWORD_STRIKE: Pose = { lean: 16, root: [4, 1], armN: [70, 5], armF: [-20, 30], weapon: 66, ...LUNGE };

export const SWORD_POSES: PoseTable = {
  ...commonPoses(SWORD_STANCE, SWORD_LOOSE),
  atk_a: { lean: -8, armN: [160, 20], armF: [40, 60], weapon: 215, ...WIDE },
  atk_b: { ...SWORD_STRIKE, smear: swing(205, 70, 8, 25) },
  atk_c: SWORD_STRIKE,
};

// ------------------------------------------------------------------ 枪兵 Spearman
const SPEAR_STANCE: Pose = { lean: 4, armN: [20, 70], grip2: 12, weapon: 122, ...FEET };
const SPEAR_LOOSE: Pose = { armN: [-40, 40], armF: [50, 40], weapon: 190, ...FEET };

export const SPEAR_POSES: PoseTable = {
  ...commonPoses(SPEAR_STANCE, SPEAR_LOOSE),
  atk_a: { lean: -6, root: [-3, 0], armN: [-35, 95], grip2: 14, weapon: 92, ...WIDE },
  atk_b: { lean: 16, root: [6, 1], armN: [75, 10], grip2: -10, weapon: 92, footN: [-10, 0], footF: [12, 0] },
  atk_c: { lean: 10, root: [4, 1], armN: [60, 20], grip2: -10, weapon: 96, ...LUNGE },
};

// ------------------------------------------------------------------ 弓兵 Archer
const ARCHER_STANCE: Pose = { lean: 2, armN: [30, 50], armF: [10, 30], weapon: 150, ...FEET };
const ARCHER_LOOSE: Pose = { armN: [-40, 40], armF: [50, 40], weapon: 190, ...FEET };
const ARCHER_AIM: Pose = { lean: -3, armN: [88, 2], weapon: 90, ...WIDE };

export const ARCHER_POSES: PoseTable = {
  ...commonPoses(ARCHER_STANCE, ARCHER_LOOSE),
  atk_a: { ...ARCHER_AIM, armF: [110, -160], prop: 'drawn' },
  atk_b: { ...ARCHER_AIM, armF: [70, -90] },
  atk_c: { ...ARCHER_AIM, armF: [40, -40] },
};

// ------------------------------------------------------------------ 力士 Brute
const BRUTE_STANCE: Pose = { lean: 6, armN: [20, 80], armF: [25, 85], footN: [-7, 0], footF: [8, 0] };
const BRUTE_LOOSE: Pose = { armN: [-50, 30], armF: [60, 30], ...FEET };

export const BRUTE_POSES: PoseTable = {
  ...commonPoses(BRUTE_STANCE, BRUTE_LOOSE),
  atk_a: { lean: -10, root: [-3, 4], armN: [-30, 110], armF: [10, 100], footN: [-10, 0], footF: [9, 0] },
  atk_b: { lean: 34, root: [6, 4], armN: [60, 60], armF: [80, 30], footN: [-14, 0], footF: [12, 2] },
  atk_c: { lean: 20, root: [2, 3], armN: [30, 40], armF: [40, 40], footN: [-8, 0], footF: [9, 0] },
};

import type { ArcSmear, Pose, RingSmear } from '../rig/pose';
import { commonPoses, type PoseTable } from './poses-common';

const SABRE_INNER = 10;
const SABRE_OUTER = 36;

function swing(from: number, to: number): ArcSmear {
  return { kind: 'arc', from, to, inner: SABRE_INNER, outer: SABRE_OUTER };
}

const BURST_RING: RingSmear = { kind: 'ring', rx: 46, ry: 11, height: 36 };

const FEET = { footN: [-6, 0], footF: [7, 0] } as const;
const WIDE = { footN: [-9, 0], footF: [9, 0] } as const;
const LUNGE = { footN: [-12, 0], footF: [14, 0] } as const;

const STANCE: Pose = { lean: 2, armN: [30, 70], armF: [-10, 20], weapon: 140, ...FEET };
const LOOSE: Pose = { armN: [-40, 40], armF: [50, 40], weapon: 200, ...FEET };
const CUT_1: Pose = { lean: 16, root: [4, 1], armN: [72, 5], armF: [-20, 30], weapon: 72, ...LUNGE };
const CUT_2: Pose = { lean: -6, root: [5, 0], armN: [130, 10], armF: [-20, 30], weapon: 155, ...WIDE };
const SLAM: Pose = { lean: 34, root: [6, 8], armN: [55, 5], armF: [70, 20], weapon: 48, ...LUNGE };

/** 于禁 Yu Jin. Each wind-up pose has a distinct silhouette so the attack can be read at a glance. */
export const YUJIN_POSES: PoseTable = {
  ...commonPoses(STANCE, LOOSE),
  // Sabre string
  s1a: { lean: -8, armN: [150, 25], armF: [30, 60], weapon: 210, ...WIDE },
  s1b: { ...CUT_1, smear: swing(205, 76) },
  s1c: CUT_1,
  s2a: { lean: 10, root: [0, 3], armN: [5, 20], armF: [-20, 30], weapon: 10, ...WIDE },
  s2b: { ...CUT_2, smear: swing(15, 155) },
  s2c: CUT_2,
  // Charge: crouch with the sabre levelled, then lunge
  ch_a: { lean: 20, root: [-4, 5], armN: [-40, 80], armF: [60, 60], weapon: 95, footN: [-12, 0], footF: [8, 0] },
  ch_b: { lean: 34, root: [6, 4], armN: [80, 5], armF: [-30, 30], weapon: 92, footN: [-14, 2], footF: [14, 0] },
  ch_c: { lean: 24, root: [0, 4], armN: [20, 30], armF: [30, 30], weapon: 20, ...WIDE },
  // Leaping cleave
  lp_a: { lean: 16, root: [0, 8], armN: [-30, 60], armF: [30, 60], weapon: 200, ...WIDE },
  lp_b: { lean: 10, armN: [165, 10], armF: [150, 10], weapon: 215, footN: [-6, 8], footF: [8, 12] },
  lp_c: { ...SLAM, smear: swing(215, 52) },
  lp_d: SLAM,
  // Command flag
  fl: { lean: -6, armN: [170, 5], armF: [-20, 20], weapon: 178, prop: 'flag', ...WIDE },
  // Guard burst
  bu_a: { lean: 10, root: [0, 6], armN: [-20, 100], armF: [0, 110], weapon: 100, ...WIDE },
  bu_b: { lean: -10, armN: [100, 10], armF: [-100, -10], weapon: 120, ...WIDE, smear: BURST_RING },
};

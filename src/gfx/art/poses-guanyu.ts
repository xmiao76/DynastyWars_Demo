import type { ArcSmear, Pose, RingSmear } from '../rig/pose';
import { commonPoses, type PoseTable } from './poses-common';

/** Blade section of the guandao, measured from the leading hand. */
const BLADE_INNER = 34;
const BLADE_OUTER = 64;

function swing(from: number, to: number): ArcSmear {
  return { kind: 'arc', from, to, inner: BLADE_INNER, outer: BLADE_OUTER };
}

const SPIN_RING: RingSmear = { kind: 'ring', rx: 62, ry: 13, height: 34 };

/** Standing guard: blade planted upright, both hands on the shaft. */
const STANCE: Pose = { lean: 3, armN: [25, 70], grip2: 7, weapon: 172, footN: [-5, 0], footF: [6, 0] };
const LOOSE: Pose = { armN: [-30, 40], armF: [50, 50], weapon: 150, footN: [-5, 0], footF: [6, 0] };
const LUNGE = { footN: [-10, 0], footF: [12, 0] } as const;
const TUCK = { footN: [-4, 8], footF: [6, 12] } as const;

const C2_STRIKE: Pose = { lean: 18, root: [5, 2], armN: [62, 10], grip2: -10, weapon: 62, ...LUNGE };
const C3_STRIKE: Pose = { lean: -8, root: [3, 0], armN: [125, 10], grip2: -10, weapon: 152, footN: [-9, 0], footF: [10, 0] };
const C4_STRIKE: Pose = { lean: 30, root: [8, 5], armN: [58, 5], grip2: -12, weapon: 52, footN: [-13, 0], footF: [15, 0] };
const DASH_STRIKE: Pose = { lean: 28, root: [8, 4], armN: [70, 8], grip2: -10, weapon: 78, footN: [-14, 0], footF: [14, 0] };
const SPIN_FRONT: Pose = { lean: 10, root: [2, 3], armN: [80, 5], grip2: -10, weapon: 88, footN: [-9, 0], footF: [9, 0] };

export const GUANYU_POSES: PoseTable = {
  ...commonPoses(STANCE, LOOSE),
  dash0: { lean: 24, root: [2, 2], armN: [-25, 30], weapon: -70, behind: true, footN: [10, 2], footF: [-10, 5] },
  dash1: { lean: 24, root: [2, 1], armN: [-25, 30], weapon: -70, behind: true, footN: [-10, 5], footF: [10, 2] },
  jump_up: { lean: 5, armN: [30, 60], grip2: 7, weapon: 160, ...TUCK },
  jump_down: { lean: 0, armN: [40, 60], grip2: 7, weapon: 165, footN: [-6, 4], footF: [7, 8] },

  // Combo 1: quick thrust
  c1_a: { lean: -4, root: [-2, 0], armN: [-30, 100], grip2: 12, weapon: 96, footN: [-7, 0], footF: [7, 0] },
  c1_b: { lean: 14, root: [5, 1], armN: [72, 12], grip2: -10, weapon: 94, footN: [-9, 0], footF: [11, 0] },
  // Combo 2: downward diagonal slash
  c2_a: { lean: -8, root: [-2, 0], armN: [150, 15], grip2: 10, weapon: 205, footN: [-7, 0], footF: [7, 0] },
  c2_b: { ...C2_STRIKE, smear: swing(195, 66) },
  c2_c: C2_STRIKE,
  // Combo 3: rising slash
  c3_a: { lean: 12, root: [0, 3], armN: [10, 25], grip2: -10, weapon: 25, footN: [-8, 0], footF: [9, 0] },
  c3_b: { ...C3_STRIKE, smear: swing(30, 150) },
  c3_c: C3_STRIKE,
  // Combo 4: overhead cleave
  c4_a: { lean: -12, root: [-3, -1], armN: [165, 15], grip2: 10, weapon: 222, footN: [-8, 0], footF: [8, 0] },
  c4_b: { ...C4_STRIKE, smear: swing(215, 56) },
  c4_c: { ...C4_STRIKE, weapon: 44 },

  // Jump attacks
  ja_a: { lean: -6, armN: [160, 15], grip2: 10, weapon: 215, ...TUCK },
  ja_b: { lean: 16, armN: [50, 10], grip2: -10, weapon: 38, footN: [-8, 10], footF: [6, 14], smear: swing(200, 42) },
  jf_a: { lean: 0, armN: [150, 15], grip2: 10, weapon: 200, footN: [-6, 8], footF: [8, 10] },
  jf_b: { lean: 22, armN: [75, 8], grip2: -10, weapon: 78, footN: [-12, 8], footF: [4, 14], smear: swing(190, 80) },

  // Dash attack: low sweep from behind
  da_a: { lean: 26, root: [4, 3], armN: [-20, 40], weapon: -60, behind: true, footN: [-10, 0], footF: [12, 2] },
  da_b: { ...DASH_STRIKE, smear: swing(-50, 78) },
  da_c: DASH_STRIKE,

  // Grab, pummel, throw
  hold: { lean: 8, armN: [-10, 30], armF: [75, 15], weapon: 175, behind: true, footN: [-7, 0], footF: [8, 0] },
  pm_a: { lean: -4, armN: [-40, 60], armF: [75, 15], weapon: 150, behind: true, footN: [-7, 0], footF: [8, 0] },
  pm_b: { lean: 16, root: [3, 1], armN: [60, 30], armF: [70, 20], weapon: 120, footN: [-8, 0], footF: [9, 4] },
  th_a: { lean: -14, armN: [140, 30], armF: [150, 10], weapon: 200, behind: true, footN: [-7, 0], footF: [8, 0] },
  th_b: { lean: 24, root: [5, 2], armN: [60, 10], armF: [70, 5], weapon: 150, behind: true, ...LUNGE },

  // 青龙斩 Dragon Cleave
  sp_a: { lean: -10, root: [0, 2], armN: [-60, 40], weapon: -85, behind: true, footN: [-9, 0], footF: [9, 0] },
  sp_b: { ...SPIN_FRONT, smear: SPIN_RING },
  sp_c: { lean: -6, root: [-2, 3], armN: [-75, 10], weapon: -88, behind: true, footN: [-9, 0], footF: [9, 0], smear: SPIN_RING },
  sp_d: { ...SPIN_FRONT, lean: 14, smear: SPIN_RING },
  sp_e: { lean: 6, armN: [40, 50], grip2: 7, weapon: 150, footN: [-7, 0], footF: [8, 0] },

  // Stroking the beard after a victory
  win: { lean: -2, armN: [25, 70], armF: [60, 110], weapon: 174, footN: [-5, 0], footF: [6, 0] },
};

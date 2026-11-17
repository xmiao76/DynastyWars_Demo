import type { Pose } from '../rig/pose';

const LYING_HIP_HEIGHT = 7;

export type PoseTable = Readonly<Record<string, Pose>>;

/**
 * The poses every fighter needs, built from two per-character bases:
 * `stance` (how it stands and carries its weapon) and `loose` (limbs when
 * it has lost its balance).
 */
export function commonPoses(stance: Pose, loose: Pose): PoseTable {
  return {
    idle0: stance,
    idle1: { ...stance, root: [0, 1] },
    walk0: { ...stance, root: [0, 1], footN: [9, 0], footF: [-9, 0] },
    walk1: { ...stance, footN: [2, 0], footF: [-3, 4] },
    walk2: { ...stance, root: [0, 1], footN: [-9, 0], footF: [9, 0] },
    walk3: { ...stance, footN: [-3, 4], footF: [2, 0] },
    hurt: { ...loose, lean: -16, head: 'pain', root: [-2, 1], footN: [-8, 0], footF: [4, 0] },
    fall: { ...loose, spin: -62, head: 'pain', root: [0, -6], footN: [6, 6], footF: [12, 2] },
    down: { ...loose, spin: -90, head: 'pain', hipY: LYING_HIP_HEIGHT, footN: [1, 2], footF: [-2, 4] },
    getup: { ...stance, lean: 34, root: [0, 12], footN: [-9, 0], footF: [8, 0] },
  };
}

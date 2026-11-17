import type { FighterKind } from '../../sim/types';
import type { Pose } from '../rig/pose';
import type { PoseTable } from './poses-common';
import { ARCHER_POSES, BRUTE_POSES, SPEAR_POSES, SWORD_POSES } from './poses-enemies';
import { GUANYU_POSES } from './poses-guanyu';
import { YUJIN_POSES } from './poses-yujin';

export const POSES: Readonly<Record<FighterKind, PoseTable>> = {
  guanyu: GUANYU_POSES,
  sword: SWORD_POSES,
  spear: SPEAR_POSES,
  archer: ARCHER_POSES,
  brute: BRUTE_POSES,
  yujin: YUJIN_POSES,
};

export const FALLBACK_POSE = 'idle0';

/** The pose for a fighter kind, falling back to its idle stance if the id is not authored for it. */
export function poseOf(kind: FighterKind, id: string): Pose {
  return POSES[kind][id] ?? POSES[kind][FALLBACK_POSE];
}

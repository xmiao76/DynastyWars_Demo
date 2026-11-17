import { lerp } from '../../core/math';
import { RED_CLIFFS } from './red-cliffs';
import type { StageDef } from './types';

export const STAGES: Readonly<Record<string, StageDef>> = {
  [RED_CLIFFS.id]: RED_CLIFFS,
};

export const FIRST_STAGE_ID = RED_CLIFFS.id;

export function getStage(id: string): StageDef {
  const stage = STAGES[id];
  if (!stage) throw new Error(`Unknown stage id: ${id}`);
  return stage;
}

/**
 * Walkable depth range at a given x. Bands narrow in over `bandRamp` pixels
 * so fighters are funnelled onto a gangplank instead of hitting a wall.
 */
export function zBandAt(stage: StageDef, x: number): readonly [number, number] {
  let zMin = stage.zMin;
  let zMax = stage.zMax;
  for (const band of stage.bands) {
    const outside = x < band.x0 ? band.x0 - x : x > band.x1 ? x - band.x1 : 0;
    if (outside >= stage.bandRamp) continue;
    const t = 1 - outside / stage.bandRamp;
    zMin = Math.max(zMin, lerp(stage.zMin, band.zMin, t));
    zMax = Math.min(zMax, lerp(stage.zMax, band.zMax, t));
  }
  return [zMin, zMax];
}

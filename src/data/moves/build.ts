import type { Box } from '../../core/math';
import type { HitDef, SparkKind } from '../../sim/types';

const DEFAULT_Z_RANGE = 12;
const FLINCH_HITSTOP = 5;
const FLINCH_STUN = 18;
const FLINCH_KBX = 1.2;
const KNOCKDOWN_HITSTOP = 9;
const KNOCKDOWN_KBX = 3.2;
const KNOCKDOWN_KBY = 4.4;

export interface HitOptions {
  readonly z?: number;
  readonly stun?: number;
  readonly kbx?: number;
  readonly kby?: number;
  readonly spark?: SparkKind;
  readonly radial?: boolean;
  readonly hitstop?: number;
}

/** A light hit: the victim staggers in place and can be chained into. */
export function flinch(hitBox: Box, damage: number, o: HitOptions = {}): HitDef {
  return {
    box: hitBox,
    zRange: o.z ?? DEFAULT_Z_RANGE,
    damage,
    hitstop: o.hitstop ?? FLINCH_HITSTOP,
    stun: o.stun ?? FLINCH_STUN,
    kbx: o.kbx ?? FLINCH_KBX,
    kby: 0,
    react: 'flinch',
    spark: o.spark ?? 'slash',
    heavy: false,
    radial: o.radial ?? false,
  };
}

/** A heavy hit: the victim is launched and lands on its back. */
export function knockdown(hitBox: Box, damage: number, o: HitOptions = {}): HitDef {
  return {
    box: hitBox,
    zRange: o.z ?? DEFAULT_Z_RANGE,
    damage,
    hitstop: o.hitstop ?? KNOCKDOWN_HITSTOP,
    stun: 0,
    kbx: o.kbx ?? KNOCKDOWN_KBX,
    kby: o.kby ?? KNOCKDOWN_KBY,
    react: 'knockdown',
    spark: o.spark ?? 'slash',
    heavy: true,
    radial: o.radial ?? false,
  };
}

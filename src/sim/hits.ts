import { box, sign } from '../core/math';
import { flinch, knockdown } from '../data/moves/build';
import {
  ARROW_DAMAGE,
  BARREL_BLAST_DAMAGE,
  FIRE_DAMAGE,
  MAST_DAMAGE,
  RAIN_DAMAGE,
  THROW_BODY_DAMAGE,
} from '../data/tuning';
import type { Facing, HitDef, Team } from './types';

/** Hits that do not come from a fighter's move frame. Their boxes are unused. */
const NO_BOX = box(0, 0, 0, 0);

export const ARROW_HIT: HitDef = flinch(NO_BOX, ARROW_DAMAGE, { stun: 16, kbx: 1.6 });
export const FIRE_HIT: HitDef = knockdown(NO_BOX, FIRE_DAMAGE, { spark: 'fire', kbx: 2.4, kby: 3.2, hitstop: 4 });
export const MAST_HIT: HitDef = knockdown(NO_BOX, MAST_DAMAGE, { spark: 'blunt', kbx: 3, kby: 4 });
export const RAIN_HIT: HitDef = knockdown(NO_BOX, RAIN_DAMAGE, { kbx: 2, kby: 3, hitstop: 4 });
export const BLAST_HIT: HitDef = knockdown(NO_BOX, BARREL_BLAST_DAMAGE, { spark: 'fire', kbx: 4, kby: 5 });
export const THROWN_BODY_HIT: HitDef = knockdown(NO_BOX, THROW_BODY_DAMAGE, { spark: 'blunt', kbx: 3, kby: 3.8 });

/** Which way a victim is thrown by something centred at `originX`. */
export function awayFrom(originX: number, victim: { readonly x: number }, fallback: Facing): Facing {
  return sign(victim.x - originX) || fallback;
}

/** A hit found this tick, applied after every hit has been collected so trades are fair. */
export interface PendingHit {
  readonly victimId: number;
  /** 0 when the source is not a fighter's move. */
  readonly attackerId: number;
  readonly hit: HitDef;
  readonly dir: Facing;
  /** Who gets credit; hazards are 'neutral'. */
  readonly byTeam: Team | 'neutral';
}

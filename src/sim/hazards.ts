import { ARROW_Z_RANGE, FIRE_MAX_HEIGHT } from '../data/tuning';
import { canBeHit, hurtBoxOf } from './hit-detect';
import { ARROW_HIT, awayFrom, FIRE_HIT, MAST_HIT, RAIN_HIT, type PendingHit } from './hits';
import type { Draft, FighterData, HazardData, HitDef, ProjectileData } from './types';
import { emit, fx, sfx } from './world';

const STRIKE_MAX_HEIGHT = 60;
const MAST_SHAKE = 7;
const OFFSTAGE_MARGIN = 80;

function inZone(h: HazardData, v: FighterData): boolean {
  return Math.abs(v.x - h.x) <= h.halfW && Math.abs(v.z - h.z) <= h.halfD;
}

/** Already knocked off its feet (or frozen mid-hit): fire must not burn the same fighter again every tick. */
function isAlreadyReeling(v: FighterData): boolean {
  return v.state === 'launched' || v.hitstop > 0;
}

function hitZone(d: Draft, h: HazardData, hit: HitDef, maxHeight: number, out: PendingHit[]): void {
  const scaled: HitDef = { ...hit, damage: h.damage };
  const persistent = h.kind === 'fire';
  for (const v of d.fighters) {
    if (v.y > maxHeight || !inZone(h, v) || !canBeHit(d, v)) continue;
    if (persistent && isAlreadyReeling(v)) continue;
    out.push({ victimId: v.id, attackerId: 0, hit: scaled, dir: awayFrom(h.x, v, 1), byTeam: 'neutral' });
  }
}

/** A one-shot strike (falling mast, arrow volley) lands. */
function strike(d: Draft, h: HazardData, out: PendingHit[]): void {
  if (h.kind === 'mast') {
    hitZone(d, h, MAST_HIT, STRIKE_MAX_HEIGHT, out);
    sfx(d, 'mast_fall');
    emit(d, { t: 'shake', power: MAST_SHAKE });
    fx(d, 'dust', h.x, 0, h.z, true);
    return;
  }
  hitZone(d, h, RAIN_HIT, STRIKE_MAX_HEIGHT, out);
  sfx(d, 'arrow_hit');
}

/** Burn anyone standing in fire, count down pending strikes, and retire spent ones. */
export function updateHazards(d: Draft): PendingHit[] {
  const out: PendingHit[] = [];
  for (const h of d.hazards) {
    if (h.kind === 'fire') {
      hitZone(d, h, FIRE_HIT, FIRE_MAX_HEIGHT, out);
    } else if (h.delay > 0) {
      h.delay -= 1;
      if (h.delay === 0) strike(d, h, out);
    } else if (h.ttl > 0) {
      h.ttl -= 1;
    }
  }
  d.hazards = d.hazards.filter((h) => h.kind === 'fire' || h.delay > 0 || h.ttl > 0);
  return out;
}

function arrowVictim(d: Draft, arrow: ProjectileData): FighterData | undefined {
  return d.fighters.find((v) => {
    if (v.team === arrow.team || Math.abs(v.z - arrow.z) > ARROW_Z_RANGE || !canBeHit(d, v)) return false;
    const body = hurtBoxOf(v);
    return arrow.x >= body.x0 && arrow.x <= body.x1 && arrow.y >= body.y0 && arrow.y <= body.y1;
  });
}

/** Fly arrows forward; the first fighter one touches takes the hit. */
export function updateProjectiles(d: Draft): PendingHit[] {
  const out: PendingHit[] = [];
  for (const arrow of d.projectiles) {
    arrow.x += arrow.vx;
    arrow.ttl -= 1;
    const v = arrowVictim(d, arrow);
    if (!v) continue;
    arrow.ttl = 0;
    out.push({ victimId: v.id, attackerId: 0, hit: { ...ARROW_HIT, damage: arrow.damage }, dir: arrow.vx < 0 ? -1 : 1, byTeam: arrow.team });
    fx(d, 'spark_slash', arrow.x, arrow.y, arrow.z);
    sfx(d, 'arrow_hit');
  }
  const left = d.cameraX - OFFSTAGE_MARGIN;
  const right = d.cameraX + OFFSTAGE_MARGIN * 6;
  d.projectiles = d.projectiles.filter((a) => a.ttl > 0 && a.x > left && a.x < right);
  return out;
}

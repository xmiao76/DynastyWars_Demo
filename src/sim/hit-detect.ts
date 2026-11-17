import { boxesOverlap, placeBox, type Box } from '../core/math';
import { FIGHTERS } from '../data/fighters';
import {
  BARREL_BLAST_RADIUS,
  FLASH_TICKS,
  PICKUP_HOP_VY,
  PICKUP_TTL,
  PROP_HALF_WIDTH,
  PROP_HEIGHT,
  THROWN_BODY_HALF_WIDTH,
  THROWN_BODY_HEIGHT,
} from '../data/tuning';
import { currentFrame, frameFlags } from './fighter-moves';
import { awayFrom, BLAST_HIT, THROWN_BODY_HIT, type PendingHit } from './hits';
import { F_INVULN, type Draft, type Facing, type FighterData, type HitDef, type PropData } from './types';
import { allocId, emit, fx, sfx } from './world';

const UNHITTABLE = new Set(['down', 'getup', 'dead', 'grabbed', 'thrown']);
const BLAST_DEPTH_WEIGHT = 2;
const BLAST_SHAKE = 6;
const THROWN_Z_RANGE = 12;

/** Can this fighter take a hit right now? */
export function canBeHit(d: Draft, v: FighterData): boolean {
  if (v.hp <= 0 || v.invuln > 0 || UNHITTABLE.has(v.state)) return false;
  if (frameFlags(v) & F_INVULN) return false;
  // The hero cannot be hurt under the test cheat, or once the stage is won.
  return !(v.team === 'player' && (d.cheats.invincible || d.stage.cleared));
}

export function hurtBoxOf(v: FighterData): Box {
  return placeBox(FIGHTERS[v.kind].hurtBox, v.x, v.y, v.facing);
}

function explode(d: Draft, prop: PropData, out: PendingHit[]): void {
  fx(d, 'explode', prop.x, PROP_HEIGHT / 2, prop.z, true);
  sfx(d, 'explode');
  emit(d, { t: 'shake', power: BLAST_SHAKE });
  for (const v of d.fighters) {
    if (!canBeHit(d, v)) continue;
    const dx = v.x - prop.x;
    const dz = (v.z - prop.z) * BLAST_DEPTH_WEIGHT;
    if (dx * dx + dz * dz > BARREL_BLAST_RADIUS * BARREL_BLAST_RADIUS) continue;
    out.push({ victimId: v.id, attackerId: 0, hit: BLAST_HIT, dir: awayFrom(prop.x, v, 1), byTeam: 'neutral' });
  }
}

/** Damage a crate, jar or barrel; breaking it drops its contents (or sets off the barrel). */
export function hitProp(d: Draft, prop: PropData, out: PendingHit[]): void {
  prop.hp -= 1;
  prop.flash = FLASH_TICKS;
  if (prop.hp > 0) {
    sfx(d, 'hit_light');
    return;
  }
  fx(d, 'break', prop.x, PROP_HEIGHT / 2, prop.z);
  sfx(d, 'break');
  if (prop.drop) {
    d.pickups.push({ id: allocId(d), kind: prop.drop, x: prop.x, y: 0, z: prop.z, vy: PICKUP_HOP_VY, ttl: PICKUP_TTL });
  }
  if (prop.kind === 'barrel') explode(d, prop, out);
}

function propBox(p: PropData): Box {
  return { x0: p.x - PROP_HALF_WIDTH, x1: p.x + PROP_HALF_WIDTH, y0: 0, y1: PROP_HEIGHT };
}

function collectMoveHits(d: Draft, a: FighterData, hit: HitDef, out: PendingHit[]): void {
  const area = placeBox(hit.box, a.x, a.y, a.facing);
  for (const v of d.fighters) {
    if (v.team === a.team || a.hitIds.includes(v.id) || !canBeHit(d, v)) continue;
    if (Math.abs(v.z - a.z) > hit.zRange || !boxesOverlap(area, hurtBoxOf(v))) continue;
    a.hitIds.push(v.id);
    const dir = hit.radial ? awayFrom(a.x, v, a.facing) : a.facing;
    out.push({ victimId: v.id, attackerId: a.id, hit, dir, byTeam: a.team });
  }
  if (a.team !== 'player') return;
  for (const prop of d.props) {
    if (prop.hp <= 0 || a.hitIds.includes(prop.id)) continue;
    if (Math.abs(prop.z - a.z) > hit.zRange || !boxesOverlap(area, propBox(prop))) continue;
    a.hitIds.push(prop.id);
    hitProp(d, prop, out);
  }
}

/** A thrown body bowls over others on its own side. */
function collectThrownHits(d: Draft, body: FighterData, out: PendingHit[]): void {
  const area: Box = {
    x0: body.x - THROWN_BODY_HALF_WIDTH,
    x1: body.x + THROWN_BODY_HALF_WIDTH,
    y0: body.y,
    y1: body.y + THROWN_BODY_HEIGHT,
  };
  const dir: Facing = body.vx < 0 ? -1 : 1;
  for (const v of d.fighters) {
    if (v.id === body.id || v.team !== body.team || body.hitIds.includes(v.id) || !canBeHit(d, v)) continue;
    if (Math.abs(v.z - body.z) > THROWN_Z_RANGE || !boxesOverlap(area, hurtBoxOf(v))) continue;
    body.hitIds.push(v.id);
    out.push({ victimId: v.id, attackerId: 0, hit: THROWN_BODY_HIT, dir, byTeam: 'player' });
  }
}

/** Find every hit that fighters' active frames and thrown bodies land this tick. */
export function collectFighterHits(d: Draft): PendingHit[] {
  const out: PendingHit[] = [];
  for (const a of d.fighters) {
    const hit = currentFrame(a)?.hit;
    if (hit) collectMoveHits(d, a, hit, out);
    if (a.state === 'thrown') collectThrownHits(d, a, out);
  }
  return out;
}

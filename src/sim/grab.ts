import { sign } from '../core/math';
import { FIGHTERS } from '../data/fighters';
import {
  GRAB_HIT_DAMAGE,
  GRAB_HITSTOP,
  GRAB_MAX_HITS,
  GRAB_OFFSET,
  GRAB_RANGE_X,
  GRAB_RANGE_Z,
  SCORE_PER_DAMAGE,
  THROW_START_Y,
  THROW_VX,
  THROW_VY,
} from '../data/tuning';
import { applyDamage, knockOut, launch } from './reactions';
import type { Draft, FighterData } from './types';
import { emit, findFighter, fx, getPlayer, setState, sfx } from './world';

const PUMMEL_FINISH_VX = 3;
const PUMMEL_FINISH_VY = 4.2;
const RELEASE_PUSH = 1.5;
const RELEASE_STUN = 12;
const THROW_FORWARD = 8;

function isGrabbable(e: FighterData): boolean {
  if (!FIGHTERS[e.kind].grabbable || e.hp <= 0 || e.invuln > 0 || e.y > 0 || e.link) return false;
  return e.state === 'idle' || e.state === 'walk' || e.state === 'hurt';
}

function inGrabRange(p: FighterData, e: FighterData): boolean {
  const ahead = (e.x - p.x) * p.facing;
  return ahead > 0 && ahead <= GRAB_RANGE_X && Math.abs(e.z - p.z) <= GRAB_RANGE_Z;
}

/** Walking into an enemy takes hold of it. */
export function tryGrab(d: Draft): void {
  const p = getPlayer(d);
  if (!p || p.state !== 'walk' || p.link || !FIGHTERS[p.kind].moves.pummel) return;
  if (sign(p.vx) !== p.facing) return;
  const target = d.fighters.find((e) => e.team !== p.team && isGrabbable(e) && inGrabRange(p, e));
  if (!target) return;
  p.link = target.id;
  p.grabHits = 0;
  p.vx = 0;
  p.vz = 0;
  setState(p, 'grabbing');
  target.link = p.id;
  target.vx = 0;
  target.vz = 0;
  setState(target, 'grabbed');
  holdInPlace(p, target);
  sfx(d, 'grab');
}

/** Keep the held fighter pinned in front of its grabber. */
export function holdInPlace(grabber: FighterData, victim: FighterData): void {
  victim.x = grabber.x + grabber.facing * GRAB_OFFSET;
  victim.z = grabber.z;
  victim.y = 0;
  victim.facing = grabber.facing === 1 ? -1 : 1;
}

function heldVictim(d: Draft, f: FighterData): FighterData | undefined {
  const victim = f.link ? findFighter(d, f.link) : undefined;
  return victim && victim.state === 'grabbed' ? victim : undefined;
}

/** One pummel strike on the held enemy; the last one knocks it away. */
export function grabHit(d: Draft, f: FighterData): void {
  const v = heldVictim(d, f);
  if (!v) return;
  applyDamage(v, GRAB_HIT_DAMAGE);
  f.grabHits += 1;
  f.hitstop = GRAB_HITSTOP;
  v.hitstop = GRAB_HITSTOP;
  d.player.score += GRAB_HIT_DAMAGE * SCORE_PER_DAMAGE;
  fx(d, 'spark_blunt', v.x, FIGHTERS[v.kind].chestHeight, v.z);
  sfx(d, 'hit_light');
  emit(d, { t: 'enemyHit', id: v.id });
  if (v.hp > 0 && f.grabHits < GRAB_MAX_HITS) return;
  launch(d, v, f.facing * PUMMEL_FINISH_VX, PUMMEL_FINISH_VY);
  if (v.hp <= 0) knockOut(d, v);
}

/** Hurl the held enemy; while flying its body hits its own side. */
export function throwVictim(d: Draft, f: FighterData): void {
  const v = heldVictim(d, f);
  if (!v) return;
  f.link = 0;
  v.link = 0;
  setState(v, 'thrown');
  v.x = f.x + f.facing * THROW_FORWARD;
  v.y = THROW_START_Y;
  v.vx = f.facing * THROW_VX;
  v.vy = THROW_VY;
  v.vz = 0;
  v.hitIds = [];
  v.facing = f.facing === 1 ? -1 : 1;
}

/** Let go without attacking. */
export function releaseGrab(d: Draft, f: FighterData): void {
  const v = heldVictim(d, f);
  f.link = 0;
  setState(f, 'idle');
  if (!v) return;
  v.link = 0;
  setState(v, 'hurt');
  v.stun = RELEASE_STUN;
  v.vx = f.facing * RELEASE_PUSH;
}

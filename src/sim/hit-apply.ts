import type { SfxId } from '../data/audio-ids';
import { FIGHTERS } from '../data/fighters';
import { getMove } from '../data/moves';
import {
  BOSS_FLINCH_LIMIT,
  BOSS_FLINCH_WINDOW,
  KO_LAUNCH_VX,
  MIN_KO_LAUNCH_VY,
  SCORE_PER_DAMAGE,
  SPECIAL_MIN_HP,
} from '../data/tuning';
import { frameFlags, startMove } from './fighter-moves';
import type { PendingHit } from './hits';
import { applyDamage, breakLink, knockOut, launch, stagger } from './reactions';
import { F_ARMOR, type Draft, type FighterData, type FxKind, type HitDef } from './types';
import { emit, findFighter, fx, isAirborne, sfx } from './world';

const HEAVY_SHAKE = 3;
const AIR_FLINCH_VX = 2;
const AIR_FLINCH_VY = 3;

const SPARK_FX: Readonly<Record<HitDef['spark'], FxKind>> = {
  slash: 'spark_slash',
  blunt: 'spark_blunt',
  fire: 'spark_fire',
};

function hitSound(v: FighterData, hit: HitDef): SfxId {
  if (v.team === 'player') return 'player_hurt';
  if (hit.spark === 'fire') return 'hit_fire';
  if (hit.heavy) return 'hit_heavy';
  return hit.spark === 'slash' ? 'hit_slash' : 'hit_light';
}

function feedback(d: Draft, v: FighterData, hit: HitDef): void {
  fx(d, SPARK_FX[hit.spark], v.x, v.y + FIGHTERS[v.kind].chestHeight, v.z, hit.heavy);
  sfx(d, hitSound(v, hit));
  if (hit.heavy) emit(d, { t: 'shake', power: HEAVY_SHAKE });
  if (v.team === 'enemy') emit(d, { t: 'enemyHit', id: v.id });
}

/** The attacker freezes with the victim, and pays any health cost on first contact. */
function attackerConnect(a: FighterData, hit: HitDef): void {
  a.hitstop = Math.max(a.hitstop, hit.hitstop);
  if (a.moveHit) return;
  a.moveHit = true;
  const cost = a.moveId ? getMove(a.moveId).hpCost : undefined;
  if (cost) a.hp = Math.max(SPECIAL_MIN_HP, a.hp - cost);
}

/** A boss that has been staggered too often answers with its guard burst. */
function tryGuardBurst(d: Draft, v: FighterData): boolean {
  const burst = FIGHTERS[v.kind].ai?.burst;
  if (!burst || !v.ai) return false;
  v.ai.flinches += 1;
  v.ai.flinchTimer = BOSS_FLINCH_WINDOW;
  if (v.ai.flinches < BOSS_FLINCH_LIMIT) return false;
  v.ai.flinches = 0;
  breakLink(d, v);
  startMove(d, v, burst);
  return true;
}

function react(d: Draft, v: FighterData, p: PendingHit, armored: boolean, airborne: boolean): void {
  const hit = p.hit;
  if (v.hp <= 0) {
    launch(d, v, p.dir * Math.max(hit.kbx, KO_LAUNCH_VX), Math.max(hit.kby, MIN_KO_LAUNCH_VY));
    knockOut(d, v);
    return;
  }
  if (armored) return;
  if (hit.react === 'knockdown') {
    launch(d, v, p.dir * hit.kbx, hit.kby);
    if (v.ai) v.ai.flinches = 0;
    return;
  }
  if (airborne) {
    launch(d, v, p.dir * AIR_FLINCH_VX, AIR_FLINCH_VY);
    return;
  }
  if (tryGuardBurst(d, v)) return;
  stagger(d, v, hit.stun, p.dir * hit.kbx);
}

/** Apply one collected hit: damage, hitstop, feedback and the victim's reaction. */
export function applyHit(d: Draft, p: PendingHit): void {
  const v = findFighter(d, p.victimId);
  if (!v || v.hp <= 0) return;
  const hit = p.hit;
  const armored = (frameFlags(v) & F_ARMOR) !== 0 && hit.react === 'flinch';
  const airborne = isAirborne(v);
  applyDamage(v, hit.damage);
  v.hitstop = hit.hitstop;
  const attacker = p.attackerId ? findFighter(d, p.attackerId) : undefined;
  if (attacker) attackerConnect(attacker, hit);
  if (p.byTeam === 'player') d.player.score += hit.damage * SCORE_PER_DAMAGE;
  feedback(d, v, hit);
  react(d, v, p, armored, airborne);
}

import { sign } from '../../core/math';
import { FIGHTERS } from '../../data/fighters';
import { BOSS_FINAL_PHASE, BOSS_MAX_REPEATS, BOSS_PHASE_2, BOSS_PHASE_3, BOSS_PLAN_TIMEOUT } from '../../data/tuning';
import { NO_INTENT, type AiData, type Draft, type FighterData, type Intent, type MoveId } from '../types';
import { emit, rand, randRange } from '../world';
import { clampToScreen, lineUpOn, moveToward } from './steer';

const SABRE: MoveId = 'yj_sabre';
const CHARGE: MoveId = 'yj_charge';
const LEAP: MoveId = 'yj_leap';
const FLAG: MoveId = 'yj_flag';

const SABRE_RANGE = 40;
const SABRE_Z_TOL = 5;
const SABRE_APPROACH = 30;
const CHARGE_MIN_GAP = 56;
const CHARGE_SETUP_GAP = 104;
const CHARGE_Z_TOL = 4;
const LEAP_RANGE = 180;
const FAR_GAP = 90;
const DOUBLE_CHARGE_CHANCE = 0.6;

/** Rest between patterns, by phase: he gets less patient as the fight goes on. */
const REST: Readonly<Record<number, readonly [number, number]>> = {
  1: [50, 80],
  2: [34, 60],
  3: [20, 40],
};

export function phaseFor(hpFraction: number): number {
  if (hpFraction <= BOSS_PHASE_3) return BOSS_FINAL_PHASE;
  return hpFraction <= BOSS_PHASE_2 ? 2 : 1;
}

interface Option {
  readonly move: MoveId;
  readonly weight: number;
}

/** Weighted options for the next pattern given distance and phase. */
export function patternOptions(phase: number, gap: number, ai: Pick<AiData, 'lastMove' | 'repeats'>): Option[] {
  const far = gap >= FAR_GAP;
  const options: Option[] = [
    { move: SABRE, weight: far ? 2 : 4 },
    { move: CHARGE, weight: (far ? 3 : 2) + (phase === BOSS_FINAL_PHASE ? 2 : 0) },
  ];
  if (phase >= 2) options.push({ move: LEAP, weight: 2 });
  // Never the same pattern three times running.
  return options.filter((o) => !(o.move === ai.lastMove && ai.repeats >= BOSS_MAX_REPEATS));
}

function choosePattern(d: Draft, phase: number, gap: number, ai: AiData): MoveId {
  const options = patternOptions(phase, gap, ai);
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let roll = rand(d) * total;
  for (const o of options) {
    roll -= o.weight;
    if (roll <= 0) return o.move;
  }
  return options[options.length - 1].move;
}

function start(d: Draft, f: FighterData, p: FighterData, ai: AiData, move: MoveId): Intent {
  ai.repeats = ai.lastMove === move ? ai.repeats + 1 : 1;
  ai.lastMove = move;
  ai.plan = null;
  ai.planTicks = 0;
  const rest = REST[ai.phase] ?? REST[1];
  ai.cool = Math.floor(randRange(d, rest[0], rest[1]));
  const chainsCharge = move === CHARGE && ai.phase === BOSS_FINAL_PHASE && ai.repeats < BOSS_MAX_REPEATS;
  if (chainsCharge && rand(d) < DOUBLE_CHARGE_CHANCE) {
    ai.cool = 0;
    ai.plan = CHARGE;
  }
  return { ...NO_INTENT, move, face: sign(p.x - f.x) || f.facing };
}

/** Between patterns: circle at mid range, keeping the player in view. */
function strafe(d: Draft, f: FighterData, p: FighterData, ai: AiData): Intent {
  const side = f.x >= p.x ? 1 : -1;
  return moveToward(f, clampToScreen(p.x + side * ai.dist, d.cameraX), p.z + ai.zOff, p.x);
}

/** Get into position for the planned pattern, then commit to it. */
function pursue(d: Draft, f: FighterData, p: FighterData, ai: AiData, plan: MoveId): Intent {
  const gap = Math.abs(p.x - f.x);
  const dz = Math.abs(p.z - f.z);
  const side = f.x >= p.x ? 1 : -1;
  const timedOut = ai.planTicks > BOSS_PLAN_TIMEOUT;
  if (plan === LEAP) {
    if (gap <= LEAP_RANGE || timedOut) return start(d, f, p, ai, LEAP);
    return moveToward(f, p.x, p.z, p.x);
  }
  if (plan === CHARGE) {
    if ((gap >= CHARGE_MIN_GAP && dz <= CHARGE_Z_TOL) || timedOut) return start(d, f, p, ai, CHARGE);
    return lineUpOn(f, clampToScreen(p.x + side * CHARGE_SETUP_GAP, d.cameraX), p.z, p.x);
  }
  if ((gap <= SABRE_RANGE && dz <= SABRE_Z_TOL) || timedOut) return start(d, f, p, ai, SABRE);
  return lineUpOn(f, p.x + side * SABRE_APPROACH, p.z, p.x);
}

/** 于禁 Yu Jin's brain: phases by health, telegraphed patterns, no long repeats. */
export function thinkBoss(d: Draft, f: FighterData, p: FighterData, ai: AiData): Intent {
  const phase = phaseFor(f.hp / FIGHTERS[f.kind].maxHp);
  if (phase > ai.phase) {
    ai.phase = phase;
    emit(d, { t: 'bossPhase', phase });
    return start(d, f, p, ai, FLAG);
  }
  if (!ai.entered) return moveToward(f, clampToScreen(f.x, d.cameraX), f.z, p.x);
  if (ai.cool > 0 && !ai.plan) return strafe(d, f, p, ai);
  if (!ai.plan) {
    ai.plan = choosePattern(d, phase, Math.abs(p.x - f.x), ai);
    ai.planTicks = 0;
  }
  ai.planTicks += 1;
  return pursue(d, f, p, ai, ai.plan);
}

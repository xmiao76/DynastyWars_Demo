import { clamp } from '../core/math';
import { getStage } from '../data/stages';
import { BOSS_FINAL_PHASE, BOSS_LEAP_MAX_VX, BOSS_LEAP_VY, GRAVITY } from '../data/tuning';
import { addHazard, spawnEnemy } from './spawn';
import type { Draft, FighterData, FighterKind } from './types';
import { fx, getPlayer } from './world';

const RAIN_OFFSETS = [-52, 0, 52] as const;
const RAIN_FIRST_DELAY = 50;
const RAIN_STAGGER = 15;
const RAIN_HALF_W = 16;
const RAIN_HALF_D = 7;
const REINFORCEMENT_Z_OFFSET = 14;
const FLAG_HEIGHT = 70;

/** The boss raises his flag: two soldiers rush in and arrows fall where the player stands. */
export function summonReinforcements(d: Draft, boss: FighterData): void {
  const stage = getStage(d.stageId);
  const mid = (stage.zMin + stage.zMax) / 2;
  const kinds: readonly FighterKind[] = boss.ai?.phase === BOSS_FINAL_PHASE ? ['spear', 'sword'] : ['sword', 'sword'];
  spawnEnemy(d, kinds[0], 'left', mid - REINFORCEMENT_Z_OFFSET);
  spawnEnemy(d, kinds[1], 'right', mid + REINFORCEMENT_Z_OFFSET);
  fx(d, 'summon', boss.x, FLAG_HEIGHT, boss.z);
  const p = getPlayer(d);
  if (!p) return;
  RAIN_OFFSETS.forEach((offset, i) => {
    addHazard(d, {
      kind: 'rain',
      x: p.x + offset,
      z: p.z,
      halfW: RAIN_HALF_W,
      halfD: RAIN_HALF_D,
      delay: RAIN_FIRST_DELAY + i * RAIN_STAGGER,
    });
  });
}

/** Launch the boss on an arc that lands where the player is standing now. */
export function startLeap(d: Draft, f: FighterData): void {
  const airTicks = (2 * BOSS_LEAP_VY) / GRAVITY;
  f.vy = BOSS_LEAP_VY;
  const p = getPlayer(d);
  if (!p) return;
  f.vx = clamp((p.x - f.x) / airTicks, -BOSS_LEAP_MAX_VX, BOSS_LEAP_MAX_VX);
  f.vz = (p.z - f.z) / airTicks;
  if (p.x !== f.x) f.facing = p.x > f.x ? 1 : -1;
}

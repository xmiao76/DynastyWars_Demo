import { FIGHTERS } from '../data/fighters';
import type { HazardSpawn, SpawnSide } from '../data/stages/types';
import { AI_Z_SPREAD, ARROW_DAMAGE, ARROW_HEIGHT, ARROW_SPEED, ARROW_TTL, SCREEN_W, SPAWN_OFFSCREEN } from '../data/tuning';
import type { Draft, FighterData, FighterKind } from './types';
import { allocId, buildFighter, buildHazard, rand, randRange } from './world';

const ARROW_MUZZLE = 14;

/** Bring an enemy in from just outside the screen edge. */
export function spawnEnemy(d: Draft, kind: FighterKind, side: SpawnSide, z: number): FighterData {
  const fromRight = side === 'right';
  const x = fromRight ? d.cameraX + SCREEN_W + SPAWN_OFFSCREEN : d.cameraX - SPAWN_OFFSCREEN;
  const fighter = buildFighter(allocId(d), kind, x, z, fromRight ? -1 : 1);
  const profile = FIGHTERS[kind].ai;
  if (fighter.ai && profile) {
    fighter.ai.side = fromRight ? 1 : -1;
    fighter.ai.dist = randRange(d, profile.hold[0], profile.hold[1]);
    fighter.ai.zOff = (rand(d) - 0.5) * AI_Z_SPREAD;
  }
  d.fighters.push(fighter);
  return fighter;
}

export function addHazard(d: Draft, spawn: HazardSpawn): void {
  d.hazards.push(buildHazard(allocId(d), spawn));
}

export function spawnArrow(d: Draft, shooter: FighterData): void {
  d.projectiles.push({
    id: allocId(d),
    team: shooter.team,
    x: shooter.x + shooter.facing * ARROW_MUZZLE,
    y: ARROW_HEIGHT,
    z: shooter.z,
    vx: shooter.facing * ARROW_SPEED,
    damage: ARROW_DAMAGE,
    ttl: ARROW_TTL,
  });
}

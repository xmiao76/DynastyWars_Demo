import { approach, clamp } from '../core/math';
import { FIGHTERS } from '../data/fighters';
import { zBandAt } from '../data/stages';
import type { StageDef } from '../data/stages/types';
import {
  BOSS_EDGE_INSET,
  BOUNCE_MIN_SPEED,
  BOUNCE_VX_KEEP,
  BOUNCE_VY,
  CAMERA_LEAD,
  CAMERA_MAX_STEP,
  ENEMY_EDGE_MARGIN,
  FLASH_TICKS,
  GRAVITY,
  PLAYER_EDGE_MARGIN,
  SCORE_PER_DAMAGE,
  SCREEN_W,
  THROW_LAND_DAMAGE,
} from '../data/tuning';
import { knockOut } from './reactions';
import type { Draft, FighterData } from './types';
import { fx, getPlayer, isAirborne, setState, sfx } from './world';

function bounce(d: Draft, f: FighterData): void {
  f.bounced = true;
  f.vy = BOUNCE_VY;
  f.vx *= BOUNCE_VX_KEEP;
  sfx(d, 'body_fall');
  fx(d, 'dust', f.x, 0, f.z, true);
}

function landLaunched(d: Draft, f: FighterData): void {
  if (!f.bounced && Math.abs(f.vx) >= BOUNCE_MIN_SPEED) {
    bounce(d, f);
    return;
  }
  f.vx = 0;
  setState(f, 'down');
  fx(d, 'dust', f.x, 0, f.z);
}

function landThrown(d: Draft, f: FighterData): void {
  // A body that was already defeated in the air (felled with the boss) is not credited again.
  const wasAlive = f.hp > 0;
  setState(f, 'launched');
  bounce(d, f);
  if (!wasAlive) return;
  f.hp = Math.max(0, f.hp - THROW_LAND_DAMAGE);
  f.flash = FLASH_TICKS;
  d.player.score += THROW_LAND_DAMAGE * SCORE_PER_DAMAGE;
  if (f.hp <= 0) knockOut(d, f);
}

function land(d: Draft, f: FighterData): void {
  switch (f.state) {
    case 'air':
      f.vx = 0;
      f.airAttacked = false;
      setState(f, 'idle');
      sfx(d, 'land');
      fx(d, 'dust', f.x, 0, f.z);
      return;
    case 'attack':
      f.vx = 0;
      f.vz = 0;
      f.airAttacked = false;
      return;
    case 'launched':
      landLaunched(d, f);
      return;
    case 'thrown':
      landThrown(d, f);
      return;
    default:
      return;
  }
}

function constrain(d: Draft, f: FighterData, stage: StageDef): void {
  const [zMin, zMax] = zBandAt(stage, f.x);
  f.z = clamp(f.z, zMin, zMax);
  if (f.team === 'player') {
    f.x = clamp(f.x, d.cameraX + PLAYER_EDGE_MARGIN, d.cameraX + SCREEN_W - PLAYER_EDGE_MARGIN);
  } else if (f.ai?.entered) {
    // Grunts may be knocked just out of view; the boss always stays fully on screen.
    const margin = FIGHTERS[f.kind].ai?.type === 'boss' ? -BOSS_EDGE_INSET : ENEMY_EDGE_MARGIN;
    f.x = clamp(f.x, d.cameraX - margin, d.cameraX + SCREEN_W + margin);
  }
}

/** Move one fighter by its velocity, apply gravity and landing, and keep it in bounds. */
export function integrate(d: Draft, f: FighterData, stage: StageDef): void {
  if (f.state === 'grabbed') return;
  f.x += f.vx;
  f.z += f.vz;
  if (isAirborne(f)) {
    f.vy -= GRAVITY;
    f.y += f.vy;
    if (f.y <= 0) {
      f.y = 0;
      f.vy = 0;
      land(d, f);
    }
  }
  constrain(d, f, stage);
}

/** The camera follows the player forward only, and stops at the current section's lock. */
export function updateCamera(d: Draft, stage: StageDef): void {
  const p = getPlayer(d);
  if (!p) return;
  const lastScroll = stage.width - SCREEN_W;
  const limit = Math.min(stage.sections[d.stage.section]?.lockX ?? lastScroll, lastScroll);
  const target = clamp(p.x - SCREEN_W * CAMERA_LEAD, d.cameraX, Math.max(limit, d.cameraX));
  d.cameraX = approach(d.cameraX, target, CAMERA_MAX_STEP);
}

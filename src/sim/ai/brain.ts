import { clamp } from '../../core/math';
import { FIGHTERS, type AiProfile } from '../../data/fighters';
import { AI_RETHINK_MIN, AI_RETHINK_SPREAD, AI_Z_SPREAD } from '../../data/tuning';
import { NO_INTENT, type AiData, type Draft, type FighterData, type Intent } from '../types';
import { getPlayer, rand, randRange } from '../world';
import { thinkBoss } from './boss-yujin';
import { isOnScreen } from './director';
import { clampToScreen, faceToward, lineUpOn, moveToward } from './steer';

const RANGE_INSET = 8;

/** Every so often pick a new spot to loiter in, so crowds shift instead of standing still. */
function rethink(d: Draft, ai: AiData, profile: AiProfile): void {
  ai.think -= 1;
  if (ai.think > 0) return;
  ai.think = AI_RETHINK_MIN + Math.floor(rand(d) * AI_RETHINK_SPREAD);
  ai.zOff = (rand(d) - 0.5) * AI_Z_SPREAD;
  ai.dist = randRange(d, profile.hold[0], profile.hold[1]);
}

/** Waiting for a turn: keep a respectful distance on the assigned side. */
function hold(d: Draft, f: FighterData, p: FighterData, ai: AiData, profile: AiProfile): Intent {
  const wanted = p.x + ai.side * ai.dist;
  const tx = clampToScreen(wanted, d.cameraX);
  // Pinned against the screen edge with the player too close: go around instead.
  if (tx !== wanted && Math.abs(tx - p.x) < profile.hold[0] / 2) ai.side = ai.side === 1 ? -1 : 1;
  return moveToward(f, tx, p.z + ai.zOff, p.x);
}

/** Holding an attack turn: line up in depth, close to range, then strike. */
function engage(d: Draft, f: FighterData, p: FighterData, ai: AiData, profile: AiProfile): Intent {
  const dx = p.x - f.x;
  const gap = Math.abs(dx);
  const aligned = Math.abs(p.z - f.z) <= profile.zTol;
  if (aligned && gap <= profile.range && gap >= profile.minRange) {
    ai.token = false;
    ai.mode = 'hold';
    ai.cool = Math.floor(randRange(d, profile.cool[0], profile.cool[1]));
    return { ...NO_INTENT, move: profile.attack, face: faceToward(f, p.x) };
  }
  const side = dx > 0 ? -1 : 1;
  const ideal = clamp(gap, profile.minRange + RANGE_INSET, profile.range - RANGE_INSET);
  return lineUpOn(f, clampToScreen(p.x + side * ideal, d.cameraX), p.z, p.x);
}

/** Decide what one enemy wants to do this tick. */
export function think(d: Draft, f: FighterData): Intent {
  const ai = f.ai;
  const profile = FIGHTERS[f.kind].ai;
  if (!ai || !profile) return NO_INTENT;
  if (ai.cool > 0) ai.cool -= 1;
  if (ai.flinchTimer > 0 && --ai.flinchTimer === 0) ai.flinches = 0;
  if (f.state !== 'idle' && f.state !== 'walk') return NO_INTENT;
  const p = getPlayer(d);
  if (!p || p.hp <= 0) return NO_INTENT;
  if (!ai.entered && isOnScreen(f.x, d.cameraX)) ai.entered = true;
  if (profile.type === 'boss') return thinkBoss(d, f, p, ai);
  rethink(d, ai, profile);
  return ai.token ? engage(d, f, p, ai, profile) : hold(d, f, p, ai, profile);
}

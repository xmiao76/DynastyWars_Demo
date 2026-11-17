import { FIGHTERS, type AiType } from '../../data/fighters';
import {
  AI_ONSCREEN_MARGIN,
  MAX_MELEE_TOKENS,
  MAX_MELEE_TOKENS_BOSS,
  MAX_RANGED_TOKENS,
  REBALANCE_INTERVAL,
  SCREEN_W,
  TOKEN_COOLDOWN_MIN,
  TOKEN_COOLDOWN_SPREAD,
  TOKEN_TIMEOUT,
} from '../../data/tuning';
import type { Draft, FighterData } from '../types';
import { getPlayer, rand } from '../world';

const TOKEN_TIMEOUT_REST = 60;
const DEPTH_WEIGHT = 2;
const UNFAIR_TARGET_STATES = new Set(['down', 'getup', 'dead', 'launched']);

type Grunt = FighterData & { ai: NonNullable<FighterData['ai']> };

function aiType(f: FighterData): AiType | undefined {
  return FIGHTERS[f.kind].ai?.type;
}

function isGrunt(f: FighterData): f is Grunt {
  return f.team === 'enemy' && f.hp > 0 && f.ai !== null && aiType(f) !== 'boss';
}

export function isOnScreen(x: number, cameraX: number): boolean {
  return x > cameraX + AI_ONSCREEN_MARGIN && x < cameraX + SCREEN_W - AI_ONSCREEN_MARGIN;
}

/** Attack turns are only handed out while the player can actually defend. */
export function isFairTarget(p: Pick<FighterData, 'hp' | 'state' | 'invuln'>): boolean {
  return p.hp > 0 && p.invuln === 0 && !UNFAIR_TARGET_STATES.has(p.state);
}

function isBusy(g: Grunt): boolean {
  return g.ai.token || g.state === 'attack';
}

/** How many more enemies of this type may attack right now. */
export function freeSlots(busy: number, type: AiType, bossAlive: boolean): number {
  const limit = type === 'ranged' ? MAX_RANGED_TOKENS : bossAlive ? MAX_MELEE_TOKENS_BOSS : MAX_MELEE_TOKENS;
  return Math.max(0, limit - busy);
}

function isCandidate(g: Grunt, cameraX: number): boolean {
  if (g.ai.token || g.ai.cool > 0) return false;
  return (g.state === 'idle' || g.state === 'walk') && isOnScreen(g.x, cameraX);
}

/** The waiting enemy nearest the player gets the next turn. */
function pickCandidate(grunts: readonly Grunt[], type: AiType, p: FighterData, cameraX: number): Grunt | undefined {
  let best: Grunt | undefined;
  let bestDist = Infinity;
  for (const g of grunts) {
    if (aiType(g) !== type || !isCandidate(g, cameraX)) continue;
    const dist = Math.abs(g.x - p.x) + Math.abs(g.z - p.z) * DEPTH_WEIGHT;
    if (dist < bestDist) {
      best = g;
      bestDist = dist;
    }
  }
  return best;
}

function expireTokens(grunts: readonly Grunt[]): void {
  for (const g of grunts) {
    if (!g.ai.token) continue;
    g.ai.tokenTicks += 1;
    if (g.ai.tokenTicks <= TOKEN_TIMEOUT) continue;
    g.ai.token = false;
    g.ai.mode = 'hold';
    g.ai.cool = TOKEN_TIMEOUT_REST;
  }
}

/**
 * If every melee enemy is on one side of the player, send the farthest one
 * around to the other side. Returns the id to flip, or null.
 */
export function chooseSideFlip(enemies: readonly { id: number; x: number }[], playerX: number): number | null {
  if (enemies.length < 2) return null;
  const allRight = enemies.every((e) => e.x >= playerX);
  const allLeft = enemies.every((e) => e.x < playerX);
  if (!allRight && !allLeft) return null;
  let farthest = enemies[0];
  for (const e of enemies) {
    if (Math.abs(e.x - playerX) > Math.abs(farthest.x - playerX)) farthest = e;
  }
  return farthest.id;
}

function rebalance(grunts: readonly Grunt[], p: FighterData): void {
  const melee = grunts.filter((g) => aiType(g) === 'melee' && !g.ai.token);
  const flipId = chooseSideFlip(melee, p.x);
  const flipped = melee.find((g) => g.id === flipId);
  if (flipped) flipped.ai.side = flipped.x >= p.x ? -1 : 1;
}

function grantToken(d: Draft, grunts: readonly Grunt[], p: FighterData): void {
  const bossAlive = d.fighters.some((f) => aiType(f) === 'boss' && f.hp > 0);
  for (const type of ['melee', 'ranged'] as const) {
    const busy = grunts.filter((g) => aiType(g) === type && isBusy(g)).length;
    if (freeSlots(busy, type, bossAlive) === 0) continue;
    const pick = pickCandidate(grunts, type, p, d.cameraX);
    if (!pick) continue;
    pick.ai.token = true;
    pick.ai.tokenTicks = 0;
    pick.ai.mode = 'engage';
    d.director.cooldown = TOKEN_COOLDOWN_MIN + Math.floor(rand(d) * TOKEN_COOLDOWN_SPREAD);
    return;
  }
}

/** Keeps fights fair: limits simultaneous attackers and spreads enemies around the player. */
export function updateDirector(d: Draft): void {
  const dir = d.director;
  if (dir.cooldown > 0) dir.cooldown -= 1;
  dir.rebalance += 1;
  const p = getPlayer(d);
  if (!p) return;
  const grunts = d.fighters.filter(isGrunt);
  expireTokens(grunts);
  if (dir.rebalance >= REBALANCE_INTERVAL) {
    dir.rebalance = 0;
    rebalance(grunts, p);
  }
  if (dir.cooldown > 0 || !isFairTarget(p)) return;
  grantToken(d, grunts, p);
}

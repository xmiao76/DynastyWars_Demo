import { FIGHTERS } from '../data/fighters';
import {
  GRAVITY,
  HEAL_BUN,
  HEAL_CHICKEN,
  PICKUP_RANGE_X,
  PICKUP_RANGE_Z,
  SCORE_FOOD,
  SCORE_GOLD,
} from '../data/tuning';
import type { Draft, FighterData, PickupData, PickupKind } from './types';
import { emit, fx, getPlayer, sfx } from './world';

const PICKUP_MAX_HEIGHT = 12;

const HEAL: Readonly<Record<PickupKind, number>> = { bun: HEAL_BUN, chicken: HEAL_CHICKEN, gold: 0 };
const SCORE: Readonly<Record<PickupKind, number>> = { bun: SCORE_FOOD, chicken: SCORE_FOOD, gold: SCORE_GOLD };

function hop(item: PickupData): void {
  if (item.y <= 0 && item.vy <= 0) return;
  item.vy -= GRAVITY;
  item.y += item.vy;
  if (item.y <= 0) {
    item.y = 0;
    item.vy = 0;
  }
}

function inReach(p: FighterData, item: PickupData): boolean {
  if (p.hp <= 0 || p.y > PICKUP_MAX_HEIGHT || item.y > PICKUP_MAX_HEIGHT) return false;
  return Math.abs(p.x - item.x) <= PICKUP_RANGE_X && Math.abs(p.z - item.z) <= PICKUP_RANGE_Z;
}

function collect(d: Draft, p: FighterData, item: PickupData): void {
  const heal = HEAL[item.kind];
  if (heal > 0) p.hp = Math.min(FIGHTERS[p.kind].maxHp, p.hp + heal);
  d.player.score += SCORE[item.kind];
  emit(d, { t: 'score', amount: SCORE[item.kind], x: item.x, z: item.z });
  fx(d, 'pickup', item.x, PICKUP_MAX_HEIGHT, item.z);
  sfx(d, item.kind === 'gold' ? 'pickup_gold' : 'pickup_food');
  item.ttl = 0;
}

/** Food and treasure drop with a small hop, wait to be walked over, then fade out. */
export function updatePickups(d: Draft): void {
  const p = getPlayer(d);
  for (const item of d.pickups) {
    hop(item);
    item.ttl -= 1;
    if (p && item.ttl > 0 && inReach(p, item)) collect(d, p, item);
  }
  d.pickups = d.pickups.filter((item) => item.ttl > 0);
}

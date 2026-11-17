import { describe, expect, test } from 'vitest';
import { box } from '../../src/core/math';
import { FIGHTERS } from '../../src/data/fighters';
import { flinch } from '../../src/data/moves/build';
import { BOSS_FLINCH_LIMIT, BOSS_MAX_REPEATS, MAX_MELEE_TOKENS, MAX_MELEE_TOKENS_BOSS, MAX_RANGED_TOKENS } from '../../src/data/tuning';
import { patternOptions, phaseFor } from '../../src/sim/ai/boss-yujin';
import { chooseSideFlip, freeSlots, isFairTarget, isOnScreen } from '../../src/sim/ai/director';
import { applyHit } from '../../src/sim/hit-apply';
import type { World } from '../../src/sim/types';
import { beginDraft } from '../../src/sim/world';
import { fighterOf, freshWorld, hasEvent, patchFighter, run, runUntil, START_X, START_Z, withEnemy } from '../support/world';

function crowd(count: number): World {
  let world = freshWorld({ invincible: true });
  for (let i = 0; i < count; i++) world = withEnemy(world, 'sword', START_X + 60 + i * 26, START_Z - 20 + i * 10).world;
  return world;
}

function busyMelee(world: World): number {
  return world.fighters.filter((f) => f.team === 'enemy' && (f.state === 'attack' || f.ai?.token)).length;
}

describe('AI director rules', () => {
  test('attack slots are limited per enemy type', () => {
    expect(freeSlots(0, 'melee', false)).toBe(MAX_MELEE_TOKENS);
    expect(freeSlots(MAX_MELEE_TOKENS, 'melee', false)).toBe(0);
    expect(freeSlots(0, 'melee', true)).toBe(MAX_MELEE_TOKENS_BOSS);
    expect(freeSlots(0, 'ranged', false)).toBe(MAX_RANGED_TOKENS);
    expect(freeSlots(5, 'ranged', false)).toBe(0);
  });

  test('no attack turns are handed out while the player is down or invulnerable', () => {
    expect(isFairTarget({ hp: 50, state: 'idle', invuln: 0 })).toBe(true);
    expect(isFairTarget({ hp: 50, state: 'down', invuln: 0 })).toBe(false);
    expect(isFairTarget({ hp: 50, state: 'getup', invuln: 0 })).toBe(false);
    expect(isFairTarget({ hp: 50, state: 'idle', invuln: 20 })).toBe(false);
    expect(isFairTarget({ hp: 0, state: 'idle', invuln: 0 })).toBe(false);
  });

  test('when every enemy is on one side, the farthest is sent around', () => {
    expect(chooseSideFlip([{ id: 1, x: 120 }, { id: 2, x: 200 }], 100)).toBe(2);
    expect(chooseSideFlip([{ id: 1, x: 20 }, { id: 2, x: 60 }], 100)).toBe(1);
  });

  test('no one is sent around when the player is already flanked or faces a single enemy', () => {
    expect(chooseSideFlip([{ id: 1, x: 60 }, { id: 2, x: 200 }], 100)).toBeNull();
    expect(chooseSideFlip([{ id: 1, x: 200 }], 100)).toBeNull();
  });

  test('off-screen positions are recognised', () => {
    expect(isOnScreen(200, 0)).toBe(true);
    expect(isOnScreen(-10, 0)).toBe(false);
    expect(isOnScreen(390, 0)).toBe(false);
  });

  test('never more than two melee enemies are attacking or cleared to attack at once', () => {
    // Arrange
    const world = crowd(5);

    // Act
    const after = run(world, 900);

    // Assert
    const peak = Math.max(...after.history.map(busyMelee));
    expect(peak).toBeLessThanOrEqual(MAX_MELEE_TOKENS);
    expect(peak).toBeGreaterThan(0);
  });
});

describe('enemy behaviour', () => {
  test('a lone swordsman closes in and attacks', () => {
    const { world, id } = withEnemy(freshWorld({ invincible: true }), 'sword', START_X + 120);

    const after = runUntil(world, (w) => fighterOf(w, id).state === 'attack', 600);

    expect(fighterOf(after.world, id).state).toBe('attack');
    expect(Math.abs(fighterOf(after.world, id).x - START_X)).toBeLessThanOrEqual(FIGHTERS.sword.ai?.range ?? 0);
  });

  test('an archer lines up on the lane and looses an arrow', () => {
    const { world } = withEnemy(freshWorld({ invincible: true }), 'archer', START_X + 150, START_Z + 20);

    const after = runUntil(world, (w) => w.projectiles.length > 0, 900);

    expect(after.world.projectiles).toHaveLength(1);
    expect(Math.abs(after.world.projectiles[0].z - START_Z)).toBeLessThanOrEqual(FIGHTERS.archer.ai?.zTol ?? 0);
  });

  test('enemies wait at a distance instead of crowding in without a turn', () => {
    const { world, id } = withEnemy(freshWorld({ invincible: true }), 'sword', START_X + 30);
    // Take away any chance of an attack turn.
    const resting = patchFighter(world, id, { ai: { ...fighterOf(world, id).ai!, cool: 100000 } });

    const after = run(resting, 200);

    const hold = FIGHTERS.sword.ai?.hold ?? [0, 0];
    expect(Math.abs(fighterOf(after.world, id).x - START_X)).toBeGreaterThanOrEqual(hold[0] - 8);
  });
});

describe('boss', () => {
  test('phases follow his remaining health', () => {
    expect(phaseFor(1)).toBe(1);
    expect(phaseFor(0.61)).toBe(1);
    expect(phaseFor(0.6)).toBe(2);
    expect(phaseFor(0.3)).toBe(3);
    expect(phaseFor(0.05)).toBe(3);
  });

  test('the leap is only available from the second phase', () => {
    const fresh = { lastMove: null, repeats: 0 };

    expect(patternOptions(1, 50, fresh).map((o) => o.move)).not.toContain('yj_leap');
    expect(patternOptions(2, 50, fresh).map((o) => o.move)).toContain('yj_leap');
  });

  test('the same pattern is never offered three times running', () => {
    const repeated = { lastMove: 'yj_charge', repeats: BOSS_MAX_REPEATS };

    expect(patternOptions(3, 120, repeated).map((o) => o.move)).not.toContain('yj_charge');
    expect(patternOptions(3, 120, { lastMove: 'yj_charge', repeats: 1 }).map((o) => o.move)).toContain('yj_charge');
  });

  test('crossing a health threshold raises the flag: reinforcements and an arrow volley', () => {
    const { world, id } = withEnemy(freshWorld({ invincible: true }), 'yujin', START_X + 150);
    const wounded = patchFighter(world, id, { hp: Math.floor(FIGHTERS.yujin.maxHp * 0.55) });

    const after = run(wounded, 10);

    expect(after.events.some((e) => e.t === 'bossPhase' && e.phase === 2)).toBe(true);
    expect(fighterOf(after.world, id).moveId).toBe('yj_flag');
    expect(after.world.fighters.filter((f) => f.team === 'enemy')).toHaveLength(3);
    expect(after.world.hazards.filter((h) => h.kind === 'rain')).toHaveLength(3);
  });

  test('too many staggering hits in a row trigger his guard burst', () => {
    const { world, id } = withEnemy(freshWorld(), 'yujin', START_X + 40);
    const draft = beginDraft(world);
    const jab = { victimId: id, attackerId: 0, hit: flinch(box(0, 1, 0, 1), 1), dir: 1 as const, byTeam: 'player' as const };

    for (let i = 0; i < BOSS_FLINCH_LIMIT - 1; i++) applyHit(draft, jab);
    const before = draft.fighters.find((f) => f.id === id);
    const stateBefore = before?.state;
    applyHit(draft, jab);

    const boss = draft.fighters.find((f) => f.id === id);
    expect(stateBefore).toBe('hurt');
    expect(boss?.state).toBe('attack');
    expect(boss?.moveId).toBe('yj_burst');
  });

  test('defeating him fells every remaining soldier', () => {
    const boss = withEnemy(freshWorld({ invincible: true }), 'yujin', START_X + 40);
    const guard = withEnemy(boss.world, 'sword', START_X + 160);
    const draft = beginDraft(patchFighter(guard.world, boss.id, { hp: 1 }));

    applyHit(draft, { victimId: boss.id, attackerId: 0, hit: flinch(box(0, 1, 0, 1), 5), dir: 1, byTeam: 'player' });

    expect(draft.fighters.find((f) => f.id === guard.id)?.hp).toBe(0);
    expect(hasEvent(draft.events, 'bossDown')).toBe(true);
  });
});

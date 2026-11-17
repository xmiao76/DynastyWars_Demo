import { describe, expect, test } from 'vitest';
import { FIGHTERS } from '../../src/data/fighters';
import { ARROW_DAMAGE, BARREL_BLAST_DAMAGE, FIRE_DAMAGE, HEAL_BUN, MAST_DAMAGE, SCORE_FOOD, SCORE_GOLD } from '../../src/data/tuning';
import { BTN, type PickupKind, type PropKind, type World } from '../../src/sim/types';
import { fighterOf, freshWorld, hasEvent, mashing, patchPlayer, playerOf, run, runUntil, START_X, START_Z, withDummy, withHazard } from '../support/world';

const MAX_HP = FIGHTERS.guanyu.maxHp;

function withProp(world: World, kind: PropKind, x: number, drop: PickupKind | null): World {
  // The stage's own props are replaced so only the one under test exists.
  return { ...world, nextId: world.nextId + 1, props: [{ id: world.nextId, kind, x, z: START_Z, hp: 1, drop, flash: 0 }] };
}

function withArrow(world: World, z: number): World {
  const arrow = { id: world.nextId, team: 'enemy' as const, x: START_X + 60, y: 30, z, vx: -3.6, damage: ARROW_DAMAGE, ttl: 100 };
  return { ...world, nextId: world.nextId + 1, projectiles: [arrow] };
}

describe('fire', () => {
  const FIRE = { kind: 'fire' as const, x: START_X, z: START_Z, halfW: 20, halfD: 8, delay: 0, ttl: -1, damage: FIRE_DAMAGE };

  test('burns and knocks down a fighter standing in it', () => {
    const world = withHazard(freshWorld(), FIRE);

    const after = run(world, 1);

    expect(playerOf(after.world).hp).toBe(MAX_HP - FIRE_DAMAGE);
    expect(playerOf(after.world).state).toBe('launched');
  });

  test('standing in fire burns once per knockdown, not on every tick', () => {
    const world = withHazard(freshWorld(), FIRE);

    const after = run(world, 30);

    expect(playerOf(after.world).hp).toBe(MAX_HP - FIRE_DAMAGE);
  });

  test('burns enemies as well as the player', () => {
    const { world, id } = withDummy(withHazard(freshWorld(), { ...FIRE, x: START_X + 100 }), 'sword', START_X + 100);

    const after = run(world, 1);

    expect(fighterOf(after.world, id).hp).toBe(FIGHTERS.sword.maxHp - FIRE_DAMAGE);
  });

  test('does not reach a fighter jumping over it', () => {
    const world = withHazard(patchPlayer(freshWorld(), { y: 30, vy: 2, state: 'air' }), FIRE);

    const after = run(world, 1);

    expect(playerOf(after.world).hp).toBe(MAX_HP);
  });

  test('an invincible test player is never hurt', () => {
    const world = withHazard(freshWorld({ invincible: true }), FIRE);

    const after = run(world, 10);

    expect(playerOf(after.world).hp).toBe(MAX_HP);
  });
});

describe('timed strikes', () => {
  const MAST = { kind: 'mast' as const, x: START_X, z: START_Z, halfW: 40, halfD: 9, delay: 6, ttl: 20, damage: MAST_DAMAGE };

  test('a falling mast only hurts when its warning time is up', () => {
    const world = withHazard(freshWorld(), MAST);

    const before = run(world, 5);
    const after = run(before.world, 1);

    expect(playerOf(before.world).hp).toBe(MAX_HP);
    expect(playerOf(after.world).hp).toBe(MAX_HP - MAST_DAMAGE);
    expect(hasEvent(after.events, 'shake')).toBe(true);
  });

  test('a spent strike is cleared away after lingering', () => {
    const world = withHazard(freshWorld({ invincible: true }), MAST);

    const after = run(world, 6 + 20 + 2);

    expect(after.world.hazards.some((h) => h.kind === 'mast')).toBe(false);
  });
});

describe('arrows', () => {
  test('an arrow on the same lane hits and staggers the player', () => {
    const after = runUntil(withArrow(freshWorld(), START_Z), (w) => w.projectiles.length === 0, 60);

    expect(playerOf(after.world).hp).toBe(MAX_HP - ARROW_DAMAGE);
    expect(after.history.some((w) => playerOf(w).state === 'hurt')).toBe(true);
  });

  test('an arrow on another lane flies past', () => {
    const after = run(withArrow(freshWorld(), START_Z + 20), 60);

    expect(playerOf(after.world).hp).toBe(MAX_HP);
  });
});

describe('props and pickups', () => {
  test('breaking a crate drops food, and walking over it heals', () => {
    const world = withProp(patchPlayer(freshWorld(), { hp: 50 }), 'crate', START_X + 40, 'bun');

    const broken = runUntil(world, (w) => w.props.length === 0, 60, mashing(BTN.ATTACK));
    const eaten = runUntil(broken.world, (w) => w.pickups.length === 0, 200, BTN.RIGHT);

    expect(broken.world.pickups.map((p) => p.kind)).toEqual(['bun']);
    expect(playerOf(eaten.world).hp).toBe(50 + HEAL_BUN);
    expect(eaten.world.player.score).toBeGreaterThanOrEqual(SCORE_FOOD);
  });

  test('healing never exceeds full health', () => {
    const world = withProp(patchPlayer(freshWorld(), { hp: MAX_HP - 5 }), 'crate', START_X + 40, 'chicken');

    const broken = runUntil(world, (w) => w.props.length === 0, 60, mashing(BTN.ATTACK));
    const eaten = runUntil(broken.world, (w) => w.pickups.length === 0, 200, BTN.RIGHT);

    expect(playerOf(eaten.world).hp).toBe(MAX_HP);
  });

  test('gold adds score without healing', () => {
    const world = withProp(patchPlayer(freshWorld(), { hp: 50 }), 'jar', START_X + 40, 'gold');

    const broken = runUntil(world, (w) => w.props.length === 0, 60, mashing(BTN.ATTACK));
    const taken = runUntil(broken.world, (w) => w.pickups.length === 0, 200, BTN.RIGHT);

    expect(playerOf(taken.world).hp).toBe(50);
    expect(taken.world.player.score).toBeGreaterThanOrEqual(SCORE_GOLD);
  });

  test('an uncollected pickup eventually disappears', () => {
    const world = withProp(freshWorld(), 'crate', START_X + 40, 'bun');
    const broken = runUntil(world, (w) => w.props.length === 0, 60, mashing(BTN.ATTACK));

    const after = run(patchPlayer(broken.world, { x: START_X - 40 }), 760);

    expect(after.world.pickups).toHaveLength(0);
  });

  test('an oil barrel explodes and hurts everyone near it', () => {
    const base = withProp(freshWorld(), 'barrel', START_X + 40, null);
    const { world, id } = withDummy(base, 'brute', START_X + 70);

    const after = runUntil(world, (w) => w.props.length === 0, 60, mashing(BTN.ATTACK));

    expect(hasEvent(after.events, 'shake')).toBe(true);
    expect(fighterOf(after.world, id).hp).toBeLessThanOrEqual(FIGHTERS.brute.maxHp - BARREL_BLAST_DAMAGE);
    expect(playerOf(after.world).hp).toBe(MAX_HP - BARREL_BLAST_DAMAGE);
  });
});

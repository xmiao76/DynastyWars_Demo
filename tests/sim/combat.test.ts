import { describe, expect, test } from 'vitest';
import { FIGHTERS } from '../../src/data/fighters';
import { DEAD_TICKS, DOWN_TICKS } from '../../src/data/tuning';
import { BTN } from '../../src/sim/types';
import {
  fighterOf,
  findFighter,
  freshWorld,
  hasEvent,
  mashing,
  patchPlayer,
  playerOf,
  run,
  runUntil,
  START_X,
  START_Z,
  tap,
  withDummy,
} from '../support/world';

const IN_REACH = START_X + 40;
const FIRST_HIT_TICKS = 8;

describe('ground attacks', () => {
  test('first combo hit damages and staggers an enemy in reach', () => {
    // Arrange
    const { world, id } = withDummy(freshWorld(), 'sword', IN_REACH);

    // Act
    const pressed = tap(world, BTN.ATTACK);
    const after = run(pressed.world, FIRST_HIT_TICKS);

    // Assert
    const enemy = fighterOf(after.world, id);
    expect(enemy.hp).toBe(FIGHTERS.sword.maxHp - 8);
    expect(enemy.state).toBe('hurt');
    expect(hasEvent(after.events, 'enemyHit')).toBe(true);
  });

  test('an attack misses an enemy standing on a different lane', () => {
    const { world, id } = withDummy(freshWorld(), 'sword', IN_REACH, START_Z + 22);

    const after = run(tap(world, BTN.ATTACK).world, 20);

    expect(fighterOf(after.world, id).hp).toBe(FIGHTERS.sword.maxHp);
  });

  test('the hit freezes attacker and victim for a moment (hitstop)', () => {
    const { world, id } = withDummy(freshWorld(), 'sword', IN_REACH);

    const hit = runUntil(tap(world, BTN.ATTACK).world, (w) => fighterOf(w, id).hp < FIGHTERS.sword.maxHp, 20);

    expect(playerOf(hit.world).hitstop).toBeGreaterThan(0);
    expect(fighterOf(hit.world, id).hitstop).toBeGreaterThan(0);
  });

  test('mashing attack chains all four hits and the last one knocks the enemy down', () => {
    const { world, id } = withDummy(freshWorld(), 'brute', IN_REACH);

    const after = runUntil(world, (w) => fighterOf(w, id).state === 'launched', 200, mashing(BTN.ATTACK));

    expect(fighterOf(after.world, id).state).toBe('launched');
    expect(fighterOf(after.world, id).hp).toBe(FIGHTERS.brute.maxHp - (8 + 10 + 12 + 20));
  });

  test('a whiffed attack never chains into the second combo move', () => {
    const world = freshWorld();

    const after = run(world, 60, mashing(BTN.ATTACK));

    const moves = new Set(after.history.map((w) => playerOf(w).moveId));
    expect(moves.has('gy_c1')).toBe(true);
    expect(moves.has('gy_c2')).toBe(false);
  });

  test('pressing a direction with attack turns to face that way first', () => {
    const world = freshWorld();

    const after = run(world, 1, BTN.ATTACK | BTN.LEFT);

    expect(playerOf(after.world).facing).toBe(-1);
    expect(playerOf(after.world).state).toBe('attack');
  });
});

describe('knockdown cycle', () => {
  test('a launched enemy lands, lies down, gets up and stands again', () => {
    const { world, id } = withDummy(freshWorld(), 'brute', IN_REACH);
    const launched = runUntil(world, (w) => fighterOf(w, id).state === 'launched', 200, mashing(BTN.ATTACK));

    const after = runUntil(launched.world, (w) => fighterOf(w, id).state === 'idle', 300);

    const states = after.history.map((w) => fighterOf(w, id).state);
    expect(states).toContain('down');
    expect(states).toContain('getup');
    expect(states.indexOf('down')).toBeLessThan(states.indexOf('getup'));
    expect(fighterOf(after.world, id).state).toBe('idle');
  });

  test('a downed enemy cannot be hit', () => {
    const { world, id } = withDummy(freshWorld(), 'brute', IN_REACH);
    const down = runUntil(world, (w) => fighterOf(w, id).state === 'down', 300, mashing(BTN.ATTACK));
    const hpWhenDown = fighterOf(down.world, id).hp;
    // Stand right next to the body and keep swinging while it lies there.
    const beside = patchPlayer(down.world, { x: fighterOf(down.world, id).x - 30 });

    const after = run(beside, DOWN_TICKS - 12, mashing(BTN.ATTACK));

    expect(fighterOf(after.world, id).hp).toBe(hpWhenDown);
  });

  test('a defeated enemy awards score, blinks out and is removed', () => {
    const { world, id } = withDummy(freshWorld(), 'sword', IN_REACH, START_Z, { hp: 5 });

    const hit = runUntil(tap(world, BTN.ATTACK).world, (w) => fighterOf(w, id).hp === 0, 20);
    const after = run(hit.world, 60 + DOWN_TICKS + DEAD_TICKS);

    expect(hit.world.player.kos).toBe(1);
    expect(hit.world.player.score).toBeGreaterThanOrEqual(FIGHTERS.sword.score);
    expect(findFighter(after.world, id)).toBeUndefined();
  });

  test('an armoured wind-up shrugs off a light hit but still takes the damage', () => {
    const { world, id } = withDummy(freshWorld(), 'brute', IN_REACH, START_Z, {
      state: 'attack',
      moveId: 'br_atk',
      frame: 0,
      frameTick: 0,
    });

    const hit = runUntil(tap(world, BTN.ATTACK).world, (w) => fighterOf(w, id).hp < FIGHTERS.brute.maxHp, 20);

    expect(fighterOf(hit.world, id).hp).toBe(FIGHTERS.brute.maxHp - 8);
    expect(fighterOf(hit.world, id).state).toBe('attack');
  });
});

describe('jumping and dashing', () => {
  test('jump leaves the ground and lands back in the idle state', () => {
    const world = freshWorld();

    const up = run(world, 5, BTN.JUMP);
    const landed = runUntil(up.world, (w) => playerOf(w).state === 'idle', 80);

    expect(playerOf(up.world).state).toBe('air');
    expect(playerOf(up.world).y).toBeGreaterThan(0);
    expect(playerOf(landed.world).y).toBe(0);
  });

  test('attacking in the air knocks an enemy down', () => {
    const { world, id } = withDummy(freshWorld(), 'brute', START_X + 30);
    const airborne = run(tap(world, BTN.JUMP).world, 12);

    const after = runUntil(tap(airborne.world, BTN.ATTACK).world, (w) => fighterOf(w, id).state === 'launched', 30);

    expect(fighterOf(after.world, id).state).toBe('launched');
    expect(fighterOf(after.world, id).hp).toBe(FIGHTERS.brute.maxHp - 14);
  });

  test('only one attack is allowed per jump', () => {
    const airborne = run(tap(freshWorld(), BTN.JUMP).world, 4);

    const first = tap(airborne.world, BTN.ATTACK);
    const second = run(first.world, 20, mashing(BTN.ATTACK, 4));

    const moves = second.history.filter((w) => playerOf(w).state === 'attack').map((w) => playerOf(w).moveId);
    expect(new Set(moves).size).toBeLessThanOrEqual(1);
  });

  test('double-tapping forward dashes, and attack during the dash sweeps', () => {
    const world = freshWorld();

    const firstTap = tap(world, BTN.RIGHT);
    const dashing = run(firstTap.world, 3, BTN.RIGHT);
    const sweep = run(dashing.world, 2, BTN.RIGHT | BTN.ATTACK);

    expect(playerOf(dashing.world).state).toBe('dash');
    expect(playerOf(sweep.world).moveId).toBe('gy_da');
  });

  test('a dash ends when the direction is released', () => {
    const dashing = run(tap(freshWorld(), BTN.RIGHT).world, 3, BTN.RIGHT);

    const after = run(dashing.world, 30);

    expect(playerOf(after.world).state).toBe('idle');
  });
});

describe('special move', () => {
  const SPECIAL = BTN.ATTACK | BTN.JUMP;

  test('hits enemies on both sides and costs health on contact', () => {
    const left = withDummy(freshWorld(), 'brute', START_X - 30);
    const both = withDummy(left.world, 'brute', START_X + 30);

    const after = run(both.world, 14, (_w, i) => (i === 0 ? SPECIAL : 0));

    expect(fighterOf(after.world, left.id).state).toBe('launched');
    expect(fighterOf(after.world, both.id).state).toBe('launched');
    expect(playerOf(after.world).hp).toBe(FIGHTERS.guanyu.maxHp - 10);
  });

  test('costs nothing when it hits no one', () => {
    const after = run(freshWorld(), 40, (_w, i) => (i === 0 ? SPECIAL : 0));

    expect(playerOf(after.world).hp).toBe(FIGHTERS.guanyu.maxHp);
  });

  test('never takes the last point of health', () => {
    const { world } = withDummy(patchPlayer(freshWorld(), { hp: 5 }), 'brute', START_X + 30);

    const after = run(world, 14, (_w, i) => (i === 0 ? SPECIAL : 0));

    expect(playerOf(after.world).hp).toBe(1);
  });

  test('attack and jump pressed a few ticks apart still count as the special', () => {
    const after = run(freshWorld(), 4, (_w, i) => (i === 0 ? BTN.ATTACK : SPECIAL));

    expect(playerOf(after.world).moveId).toBe('gy_sp');
  });
});

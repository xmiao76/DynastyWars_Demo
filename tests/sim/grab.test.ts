import { describe, expect, test } from 'vitest';
import { FIGHTERS } from '../../src/data/fighters';
import { GRAB_HIT_DAMAGE, GRAB_HOLD_TICKS, GRAB_MAX_HITS, GRAB_OFFSET, THROW_BODY_DAMAGE, THROW_LAND_DAMAGE } from '../../src/data/tuning';
import { BTN, type World } from '../../src/sim/types';
import { fighterOf, freshWorld, mashing, playerOf, run, runUntil, START_X, tap, withDummy, withHazard } from '../support/world';

const GRAB_DISTANCE = 14;

function grabbed(kind: 'sword' | 'brute' = 'sword'): { world: World; id: number } {
  const { world, id } = withDummy(freshWorld(), kind, START_X + GRAB_DISTANCE);
  return { world: run(world, 2, BTN.RIGHT).world, id };
}

describe('grabs', () => {
  test('walking into an enemy takes hold of it', () => {
    // Arrange + Act
    const { world, id } = grabbed();

    // Assert
    const player = playerOf(world);
    const enemy = fighterOf(world, id);
    expect(player.state).toBe('grabbing');
    expect(enemy.state).toBe('grabbed');
    expect(enemy.x).toBeCloseTo(player.x + GRAB_OFFSET);
    expect(enemy.facing).toBe(-1);
  });

  test('a brute is too heavy to grab', () => {
    const { world, id } = grabbed('brute');

    expect(playerOf(world).state).not.toBe('grabbing');
    expect(fighterOf(world, id).state).toBe('idle');
  });

  test('three pummel strikes end with the enemy knocked away', () => {
    const { world, id } = grabbed();

    const after = runUntil(world, (w) => fighterOf(w, id).state === 'launched', 200, mashing(BTN.ATTACK));

    expect(fighterOf(after.world, id).state).toBe('launched');
    expect(fighterOf(after.world, id).hp).toBe(FIGHTERS.sword.maxHp - GRAB_HIT_DAMAGE * GRAB_MAX_HITS);
    expect(playerOf(after.world).link).toBe(0);
  });

  test('direction plus attack throws the enemy, which bowls over another', () => {
    const start = grabbed();
    const bystander = withDummy(start.world, 'spear', START_X + 90);

    const thrown = run(bystander.world, 12, (_w, i) => (i === 0 ? BTN.RIGHT | BTN.ATTACK : 0));
    const after = runUntil(thrown.world, (w) => fighterOf(w, start.id).state === 'down', 200);

    expect(thrown.history.some((w) => fighterOf(w, start.id).state === 'thrown')).toBe(true);
    expect(fighterOf(after.world, bystander.id).hp).toBe(FIGHTERS.spear.maxHp - THROW_BODY_DAMAGE);
    expect(fighterOf(after.world, start.id).hp).toBe(FIGHTERS.sword.maxHp - THROW_LAND_DAMAGE);
  });

  test('pressing back and attack throws the enemy behind', () => {
    const { world, id } = grabbed();

    const after = run(world, 14, (_w, i) => (i === 0 ? BTN.LEFT | BTN.ATTACK : 0));

    expect(fighterOf(after.world, id).x).toBeLessThan(playerOf(after.world).x);
  });

  test('holding on too long lets the enemy go', () => {
    const { world, id } = grabbed();

    const after = run(world, GRAB_HOLD_TICKS + 3);

    expect(playerOf(after.world).state).toBe('idle');
    expect(fighterOf(after.world, id).link).toBe(0);
    expect(fighterOf(after.world, id).state).not.toBe('grabbed');
  });

  test('jumping releases the hold', () => {
    const { world, id } = grabbed();

    const after = tap(world, BTN.JUMP);

    expect(playerOf(after.world).link).toBe(0);
    expect(fighterOf(after.world, id).state).not.toBe('grabbed');
  });

  test('getting hit breaks the hold and frees the enemy', () => {
    const { world, id } = grabbed();
    const player = playerOf(world);
    const burning = withHazard(world, { kind: 'fire', x: player.x - 20, z: player.z, halfW: 24, halfD: 8, delay: 0, ttl: -1, damage: 8 });

    const after = run(burning, 2);

    expect(playerOf(after.world).state).toBe('launched');
    expect(playerOf(after.world).link).toBe(0);
    expect(fighterOf(after.world, id).state).toBe('idle');
  });
});

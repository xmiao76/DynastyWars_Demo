import { describe, expect, test } from 'vitest';
import { FIRST_STAGE_ID } from '../../src/data/stages';
import { step } from '../../src/sim/step';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { botButtons, runBot } from './bot';

const TICKS = 1500;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function play(seed: number): World {
  return runBot(createWorld(FIRST_STAGE_ID, seed), TICKS, () => false).world;
}

describe('determinism', () => {
  test('the same seed and inputs give exactly the same world', () => {
    // Arrange + Act
    const first = play(2024);
    const second = play(2024);

    // Assert
    expect(second).toEqual(first);
  });

  test('different seeds lead to different fights', () => {
    const a = play(1);
    const b = play(2);

    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  test('step never modifies the world it is given', () => {
    // Arrange: a mid-fight world, frozen all the way down
    const world = deepFreeze(play(5));
    const snapshot = JSON.stringify(world);

    // Act: stepping a frozen world would throw on any write
    const result = step(world, botButtons(world));

    // Assert
    expect(JSON.stringify(world)).toBe(snapshot);
    expect(result.world).not.toBe(world);
    expect(result.world.tick).toBe(world.tick + 1);
  });

  test('the world is plain data that survives a JSON round trip', () => {
    const world = play(9);

    const copy = JSON.parse(JSON.stringify(world)) as World;

    expect(step(copy, 0).world).toEqual(step(world, 0).world);
  });
});

import { describe as suite, expect, test } from 'vitest';
import { FIRST_STAGE_ID } from '../../src/data/stages';
import { TICKS_PER_SECOND } from '../../src/data/tuning';
import { createWorld } from '../../src/sim/world';
import { step } from '../../src/sim/step';
import { botButtons, describe, runBot } from './bot';

const TEN_MINUTES = TICKS_PER_SECOND * 60 * 10;
const TWENTY_MINUTES = TICKS_PER_SECOND * 60 * 20;

suite('full stage playthrough', () => {
  test('an invincible bot fights through every section and reaches stage clear', () => {
    // Arrange
    const start = createWorld(FIRST_STAGE_ID, 1234, { invincible: true });

    // Act
    const { world, ticks } = runBot(start, TEN_MINUTES, (w) => w.phase === 'clear');

    // Assert
    expect(world.phase, describe(world)).toBe('clear');
    expect(world.stage.cleared).toBe(true);
    expect(world.player.kos).toBeGreaterThanOrEqual(36);
    expect(ticks).toBeLessThan(TEN_MINUTES);
  });

  test('a mortal bot finishes the stage, using continues if it has to', () => {
    // Arrange
    const start = createWorld(FIRST_STAGE_ID, 99);

    // Act
    const { world, ticks } = runBot(start, TWENTY_MINUTES, (w) => w.phase === 'clear' || w.phase === 'gameover');

    // Assert: the bot always continues, so it must end in a clear
    expect(world.phase, describe(world)).toBe('clear');
    // Balance signal, printed for tuning rather than asserted tightly
    console.info(
      `[balance] mortal bot: ${(ticks / TICKS_PER_SECOND).toFixed(0)}s, continues ${world.player.continues}, lives left ${world.player.lives}, score ${world.player.score}`,
    );
  });

  test('over a few fights the boss shows his whole repertoire', () => {
    // Arrange
    const seen = new Set<string>();

    // Act: play the stage with several seeds and note every move the boss starts
    for (const seed of [11, 22, 33]) {
      let world = createWorld(FIRST_STAGE_ID, seed, { invincible: true });
      for (let i = 0; i < TEN_MINUTES && world.phase !== 'clear'; i++) {
        world = step(world, botButtons(world)).world;
        const boss = world.fighters.find((f) => f.kind === 'yujin');
        if (boss?.moveId) seen.add(boss.moveId);
      }
      expect(world.phase, describe(world)).toBe('clear');
    }

    // Assert
    expect([...seen].sort()).toEqual(['yj_burst', 'yj_charge', 'yj_flag', 'yj_leap', 'yj_sabre']);
  });
});

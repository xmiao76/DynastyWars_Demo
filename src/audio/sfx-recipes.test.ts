import { describe, expect, test } from 'vitest';
import { SFX_IDS } from '../data/audio-ids';
import { SFX_RECIPES } from './sfx-recipes';
import { perc, recipeDuration, tone, type SfxRecipe } from './sfx-types';

const MAX_SECONDS = 2;
const NYQUIST_SAFE_HZ = 20000;
const ROUNDING = 1e-9;

describe('recipeDuration', () => {
  test('is the end of the last layer, release included', () => {
    // Arrange
    const recipe: SfxRecipe = {
      level: 0.5,
      layers: [
        tone('sine', 440, 440, perc(0.1), 1),
        tone('sine', 880, 880, { dur: 0.2, env: { a: 0.01, d: 0, s: 1, r: 0.05 } }, 1, { at: 0.3 }),
      ],
    };

    // Act
    const seconds = recipeDuration(recipe);

    // Assert
    expect(seconds).toBeCloseTo(0.55, 9);
  });
});

describe('sound-effect recipes', () => {
  test('there is exactly one recipe per SfxId', () => {
    expect(Object.keys(SFX_RECIPES).sort()).toEqual([...SFX_IDS].sort());
  });

  test.each(SFX_IDS)('%s lasts more than nothing and under two seconds', (id) => {
    const seconds = recipeDuration(SFX_RECIPES[id]);

    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThan(MAX_SECONDS);
  });

  test.each(SFX_IDS)('%s has a sane level and well-formed layers', (id) => {
    const recipe = SFX_RECIPES[id];

    expect(recipe.level > 0 && recipe.level <= 1).toBe(true);
    expect(recipe.layers.length).toBeGreaterThan(0);
    for (const layer of recipe.layers) {
      const { a, d, s, r } = layer.env;
      expect(layer.at).toBeGreaterThanOrEqual(0);
      expect(layer.gain > 0 && layer.gain <= 1).toBe(true);
      expect(a > 0 && d >= 0 && r > 0).toBe(true);
      expect(s >= 0 && s <= 1).toBe(true);
      // The attack and decay must fit before the release starts.
      expect(a + d).toBeLessThanOrEqual(layer.dur + ROUNDING);
      if (layer.kind === 'tone') {
        expect(layer.hz > 0 && layer.hz < NYQUIST_SAFE_HZ).toBe(true);
        expect(layer.hzEnd > 0 && layer.hzEnd < NYQUIST_SAFE_HZ).toBe(true);
      }
      if (layer.filter !== undefined) {
        expect(layer.filter.hz > 0 && layer.filter.hzEnd > 0 && layer.filter.q > 0).toBe(true);
      }
    }
  });

  test('the long effects match the lengths in the brief', () => {
    expect(recipeDuration(SFX_RECIPES.special)).toBeGreaterThan(0.5);
    expect(recipeDuration(SFX_RECIPES.special)).toBeLessThan(0.75);
    expect(recipeDuration(SFX_RECIPES.boss_ko)).toBeGreaterThan(1.3);
    expect(recipeDuration(SFX_RECIPES.boss_ko)).toBeLessThan(1.7);
    expect(recipeDuration(SFX_RECIPES.war_horn)).toBeGreaterThan(0.8);
    expect(recipeDuration(SFX_RECIPES.war_horn)).toBeLessThan(1.2);
  });

  test('short interface ticks stay short', () => {
    expect(recipeDuration(SFX_RECIPES.ui_move)).toBeLessThan(0.1);
    expect(recipeDuration(SFX_RECIPES.tally)).toBeLessThan(0.1);
  });

  test('heavier hits are louder and longer than light ones', () => {
    expect(SFX_RECIPES.hit_heavy.level).toBeGreaterThan(SFX_RECIPES.hit_light.level);
    expect(recipeDuration(SFX_RECIPES.hit_heavy)).toBeGreaterThan(
      recipeDuration(SFX_RECIPES.hit_light),
    );
    expect(recipeDuration(SFX_RECIPES.swing_heavy)).toBeGreaterThan(
      recipeDuration(SFX_RECIPES.swing_light),
    );
  });
});

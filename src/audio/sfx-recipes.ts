/**
 * Every sound effect as data. The recipes are split across two tables for
 * size; the `Record<SfxId, …>` annotation makes the compiler reject a missing id.
 */
import type { SfxId } from '../data/audio-ids';
import { COMBAT_SFX } from './sfx-recipes-combat';
import { WORLD_SFX } from './sfx-recipes-world';
import type { SfxRecipe } from './sfx-types';

export const SFX_RECIPES: Record<SfxId, SfxRecipe> = { ...COMBAT_SFX, ...WORLD_SFX };

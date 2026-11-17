/**
 * Plays sound effects. Recipes are baked to buffers in the background when
 * the player is created; until an effect's buffer is ready (or if offline
 * rendering is unavailable) it is synthesised live from the same recipe.
 */
import { SFX_IDS, type SfxId } from '../data/audio-ids';
import { SFX_RECIPES } from './sfx-recipes';
import { renderRecipe, scheduleRecipe, type RenderedSfx } from './sfx-render';
import { recipeDuration, type SfxRecipe } from './sfx-types';
import { admit, emptyLedger, withVoice } from './sfx-voices';

/** Random playback-rate spread (about +/-3%) so repeated hits do not sound cloned. */
const PITCH_VARIANCE = 0.03;
/** A near-silent render must not be boosted without limit. */
const MIN_PEAK = 0.05;
/**
 * Live synthesis cannot be peak-normalised (layers simply add up), so it plays
 * at a conservative fraction of the recipe's level.
 */
const LIVE_HEADROOM = 0.5;
const STEAL_FADE_S = 0.008;

export interface SfxPlayer {
  play(id: SfxId): void;
}

async function prerenderAll(
  sampleRate: number,
  store: (id: SfxId, sfx: RenderedSfx) => void,
): Promise<void> {
  // One at a time: a burst of 34 offline contexts would only compete with the game.
  for (const id of SFX_IDS) {
    const sfx = await renderRecipe(SFX_RECIPES[id], sampleRate);
    // One effect failing to bake must not leave the rest unbaked: it simply stays live-synthesised.
    if (sfx === null) continue;
    store(id, sfx);
  }
}

/** Start a baked effect on `voice`; returns the clock time at which it ends. */
function playRendered(
  ctx: BaseAudioContext,
  voice: GainNode,
  recipe: SfxRecipe,
  sfx: RenderedSfx,
  now: number,
): number {
  const rate = recipe.steady === true ? 1 : 1 + (Math.random() * 2 - 1) * PITCH_VARIANCE;
  const source = ctx.createBufferSource();
  source.buffer = sfx.buffer;
  source.playbackRate.value = rate;
  voice.gain.value = recipe.level / Math.max(sfx.peak, MIN_PEAK);
  source.connect(voice);
  source.start(now);
  return now + sfx.buffer.duration / rate;
}

/** Synthesise an effect live on `voice`; returns the clock time at which it ends. */
function playLive(ctx: BaseAudioContext, voice: GainNode, recipe: SfxRecipe, now: number): number {
  voice.gain.value = recipe.level * LIVE_HEADROOM;
  scheduleRecipe(ctx, voice, recipe, now);
  return now + recipeDuration(recipe);
}

export function createSfxPlayer(ctx: BaseAudioContext, bus: AudioNode): SfxPlayer {
  const rendered: Partial<Record<SfxId, RenderedSfx>> = {};
  let ledger = emptyLedger<GainNode>();

  void prerenderAll(ctx.sampleRate, (id, sfx) => {
    rendered[id] = sfx;
  });

  const play = (id: SfxId): void => {
    const now = ctx.currentTime;
    const admission = admit(ledger, id, now);
    ledger = admission.ledger;
    if (!admission.allowed) return;
    for (const stolen of admission.stolen) stolen.gain.setTargetAtTime(0, now, STEAL_FADE_S);
    const recipe = SFX_RECIPES[id];
    const sfx = rendered[id];
    const voice = ctx.createGain();
    voice.connect(bus);
    const endTime =
      sfx === undefined
        ? playLive(ctx, voice, recipe, now)
        : playRendered(ctx, voice, recipe, sfx, now);
    ledger = withVoice(ledger, { handle: voice, endTime });
  };

  return { play };
}

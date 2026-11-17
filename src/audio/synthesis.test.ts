/**
 * Smoke tests for the code that builds Web Audio graphs, run against a fake
 * context that enforces the API's scheduling rules. They cannot judge how
 * anything sounds, only that every voice and recipe builds without error.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SFX_IDS, SONG_IDS } from '../data/audio-ids';
import { playEvent } from './instruments';
import { compile, compileSong, createSequencer, type Song } from './sequencer';
import { SFX_RECIPES } from './sfx-recipes';
import { renderRecipe, scheduleRecipe } from './sfx-render';
import { SONGS } from './songs';
import { FakeAudioContext, FakeNode, asContext, asNode } from './testing/fake-audio';

const TICK_MS = 25;

describe('instrument voices', () => {
  test.each(SONG_IDS)('every event of %s builds a voice without error', (id) => {
    // Arrange
    const ctx = new FakeAudioContext();
    const out = new FakeNode('out');
    const events = compile(SONGS[id]);

    // Act
    for (const event of events) playEvent(asContext(ctx), asNode(out), event, event.time);

    // Assert: every event started at least one sound source.
    const sources = ctx.count('oscillator') + ctx.count('source');
    expect(sources).toBeGreaterThanOrEqual(events.length);
    expect(ctx.nodes.filter((node) => node.kind === 'oscillator').every((n) => n.started)).toBe(
      true,
    );
  });
});

describe('sound-effect rendering', () => {
  test.each(SFX_IDS)('%s schedules one started source per layer', (id) => {
    const ctx = new FakeAudioContext();
    const recipe = SFX_RECIPES[id];
    const vibratos = recipe.layers.filter(
      (layer) => layer.kind === 'tone' && layer.vibrato !== undefined,
    ).length;

    scheduleRecipe(asContext(ctx), asNode(new FakeNode('out')), recipe, 0.5);

    const sources = ctx.nodes.filter((n) => n.kind === 'oscillator' || n.kind === 'source');
    expect(sources).toHaveLength(recipe.layers.length + vibratos);
    expect(sources.every((node) => node.started)).toBe(true);
  });

  test('reports "not rendered" when offline rendering is unavailable', async () => {
    // Node has no OfflineAudioContext, which is exactly the fallback case.
    const rendered = await renderRecipe(SFX_RECIPES.hit_light, 44100);

    expect(rendered).toBeNull();
  });
});

describe('createSequencer', () => {
  /** 120 BPM: a 1 s loop with notes at 0, 0.25 and 0.5 s. */
  const song = (loop: boolean): Song => ({
    bpm: 120,
    stepsPerBeat: 4,
    beatsPerBar: 4,
    loop,
    tracks: [
      { instrument: 'pluck', velocity: 0.5, patterns: { p: 'A4 . C5 . E5 . . .' }, order: ['p'] },
    ],
  });

  const setup = (loop: boolean) => {
    const ctx = new FakeAudioContext();
    const starts: number[] = [];
    const sequencer = createSequencer(asContext(ctx), asNode(new FakeNode('out')), (_out, _event, when) => {
      starts.push(when);
    });
    /** Move the audio clock and let the lookahead timer catch up. */
    const runTo = (time: number): void => {
      while (ctx.currentTime < time) {
        ctx.currentTime = Math.min(time, ctx.currentTime + TICK_MS / 1000);
        vi.advanceTimersByTime(TICK_MS);
      }
    };
    return { ctx, starts, sequencer, runTo, compiled: compileSong(song(loop)) };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('schedules only a short horizon ahead of the audio clock', () => {
    const { starts, sequencer, compiled } = setup(true);

    sequencer.play(compiled);

    // Only the first note falls inside the lookahead window at time zero.
    expect(starts).toHaveLength(1);
    expect(starts[0]).toBeGreaterThan(0);
    expect(starts[0]).toBeLessThan(0.12);
    sequencer.stop();
  });

  test('keeps looping with every pass exactly one song length apart', () => {
    const { starts, sequencer, runTo, compiled } = setup(true);

    sequencer.play(compiled);
    runTo(2.2);
    sequencer.stop();

    const origin = starts[0];
    const offsets = starts.map((when) => Number((when - origin).toFixed(6)));
    expect(offsets).toEqual([0, 0.25, 0.5, 1, 1.25, 1.5, 2, 2.25]);
  });

  test('stops scheduling a one-shot song after its last note', () => {
    const { starts, sequencer, runTo, compiled } = setup(false);

    sequencer.play(compiled);
    runTo(3);

    expect(starts).toHaveLength(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  test('schedules nothing more after stop', () => {
    const { starts, sequencer, runTo, compiled } = setup(true);
    sequencer.play(compiled);
    runTo(0.3);
    const before = starts.length;

    sequencer.stop();
    runTo(2);

    expect(starts).toHaveLength(before);
  });

  test('drops notes it is too late for instead of bunching them up', () => {
    const { ctx, starts, sequencer, compiled } = setup(true);
    sequencer.play(compiled);

    // The timer stalls for five seconds while the audio clock keeps running.
    ctx.currentTime = 5;
    vi.advanceTimersByTime(TICK_MS);
    sequencer.stop();

    const late = starts.slice(1).filter((when) => when < 5 - 0.05);
    expect(late).toEqual([]);
  });
});

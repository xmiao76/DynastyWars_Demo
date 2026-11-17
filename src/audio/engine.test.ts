import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MIX } from './engine';
import { createAudioEngine } from './index';
import { FakeAudioContext, type FakeNode } from './testing/fake-audio';

const STORAGE_KEY = 'red-cliffs-ablaze.audio.muted';
const TICK_MS = 25;

function fakeStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    getItem: (key: string): string | null => items.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      items.set(key, value);
    },
  };
}

function onlyContext(): FakeAudioContext {
  expect(FakeAudioContext.instances).toHaveLength(1);
  return FakeAudioContext.instances[0];
}

function sourceCount(ctx: FakeAudioContext): number {
  return ctx.count('oscillator') + ctx.count('source');
}

/** Move the audio clock and let the music scheduler's timer catch up. */
function runTo(ctx: FakeAudioContext, time: number): void {
  while (ctx.currentTime < time) {
    ctx.currentTime = Math.min(time, ctx.currentTime + TICK_MS / 1000);
    vi.advanceTimersByTime(TICK_MS);
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeAudioContext.reset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('without Web Audio', () => {
  test('every method is a safe no-op and mute still toggles', () => {
    // Arrange: plain Node has no AudioContext at all.
    const engine = createAudioEngine();

    // Act
    engine.unlock();
    engine.playSfx('hit_light');
    engine.playSong('stage');
    engine.setSuspended(true);
    engine.setSuspended(false);
    engine.setMuted(true);

    // Assert
    expect(engine.isMuted()).toBe(true);
  });

  test('stays silent, without retrying, when creating the context throws', () => {
    const construct = vi.fn(() => {
      throw new Error('no audio device');
    });
    vi.stubGlobal('AudioContext', function Broken() {
      construct();
    });
    const engine = createAudioEngine();

    engine.unlock();
    engine.unlock();
    engine.playSfx('explode');
    engine.playSong('boss');

    expect(construct).toHaveBeenCalledTimes(1);
  });
});

describe('mute', () => {
  test('is restored from storage and written back when changed', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '1' });
    vi.stubGlobal('localStorage', storage);

    const engine = createAudioEngine();
    const wasMuted = engine.isMuted();
    engine.setMuted(false);

    expect(wasMuted).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBe('0');
    expect(createAudioEngine().isMuted()).toBe(false);
  });

  test('survives storage that throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });

    const engine = createAudioEngine();
    engine.setMuted(true);

    expect(engine.isMuted()).toBe(true);
  });

  test('silences the master bus and restores its level', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('localStorage', fakeStorage());
    const engine = createAudioEngine();
    engine.unlock();
    const master = onlyContext().nodes.find(
      (node) => node.kind === 'gain' && node.gain.value === MIX.master,
    ) as FakeNode;

    engine.setMuted(true);
    const mutedLevel = master.gain.value;
    engine.setMuted(false);

    expect(mutedLevel).toBe(0);
    expect(master.gain.value).toBe(MIX.master);
  });
});

describe('with Web Audio', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('localStorage', fakeStorage());
  });

  test('creates no context until it is unlocked, then exactly one', () => {
    const engine = createAudioEngine();
    engine.playSfx('jump');
    engine.playSong('title');
    const before = FakeAudioContext.instances.length;

    engine.unlock();
    engine.unlock();
    engine.playSong(null);

    expect(before).toBe(0);
    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  test('remembers a song requested before unlock and starts it on unlock', () => {
    const engine = createAudioEngine();
    engine.playSong('stage');

    engine.unlock();
    const ctx = onlyContext();
    runTo(ctx, 1);
    engine.playSong(null);

    expect(sourceCount(ctx)).toBeGreaterThan(0);
  });

  test('treats a request for the song already playing as a no-op', () => {
    const engine = createAudioEngine();
    engine.unlock();
    engine.playSong('boss');
    const ctx = onlyContext();
    const gainsBefore = ctx.count('gain');

    engine.playSong('boss');

    expect(ctx.count('gain')).toBe(gainsBefore);
    engine.playSong(null);
  });

  test('stops scheduling music when asked for null', () => {
    const engine = createAudioEngine();
    engine.unlock();
    engine.playSong('stage');
    const ctx = onlyContext();
    runTo(ctx, 0.5);

    engine.playSong(null);
    const afterStop = sourceCount(ctx);
    runTo(ctx, 3);

    expect(sourceCount(ctx)).toBe(afterStop);
  });

  test('plays a one-shot jingle once and does not restart it when asked again', () => {
    const engine = createAudioEngine();
    engine.unlock();
    engine.playSong('gameover');
    const ctx = onlyContext();
    runTo(ctx, 6);
    const afterJingle = sourceCount(ctx);

    engine.playSong('gameover');
    runTo(ctx, 12);

    expect(afterJingle).toBeGreaterThan(0);
    expect(sourceCount(ctx)).toBe(afterJingle);
  });

  test('plays an effect, and rate-limits the same effect on the same frame', () => {
    const engine = createAudioEngine();
    engine.unlock();
    const ctx = onlyContext();

    engine.playSfx('hit_light');
    const afterFirst = sourceCount(ctx);
    engine.playSfx('hit_light');
    const afterRepeat = sourceCount(ctx);
    engine.playSfx('hit_heavy');

    expect(afterFirst).toBeGreaterThan(0);
    expect(afterRepeat).toBe(afterFirst);
    expect(sourceCount(ctx)).toBeGreaterThan(afterRepeat);
  });

  test('drops effects while muted or suspended', () => {
    const engine = createAudioEngine();
    engine.unlock();
    const ctx = onlyContext();

    engine.setMuted(true);
    engine.playSfx('explode');
    engine.setMuted(false);
    engine.setSuspended(true);
    engine.playSfx('explode');

    expect(sourceCount(ctx)).toBe(0);
  });

  test('suspends and resumes the context, and unlock respects a suspension', () => {
    const engine = createAudioEngine();
    engine.unlock();
    const ctx = onlyContext();

    engine.setSuspended(true);
    engine.unlock();
    const stateWhilePaused = ctx.state;
    engine.setSuspended(false);

    expect(stateWhilePaused).toBe('suspended');
    expect(ctx.suspendCalls).toBe(1);
    expect(ctx.state).toBe('running');
  });

  test('applies a suspension requested before unlock', () => {
    const engine = createAudioEngine();
    engine.setSuspended(true);

    engine.unlock();

    expect(onlyContext().state).toBe('suspended');
  });

  test('still plays an effect requested while the context is starting up', () => {
    FakeAudioContext.initialState = 'suspended';
    FakeAudioContext.resumeWorks = false;
    const engine = createAudioEngine();

    engine.unlock();
    engine.playSfx('ui_confirm');

    expect(onlyContext().resumeCalls).toBe(1);
    expect(sourceCount(onlyContext())).toBeGreaterThan(0);
  });

  test('drops effects for a context that has stayed stopped', () => {
    FakeAudioContext.initialState = 'suspended';
    FakeAudioContext.resumeWorks = false;
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000);
    const engine = createAudioEngine();
    engine.unlock();

    clock.mockReturnValue(5000);
    engine.playSfx('ui_confirm');

    expect(sourceCount(onlyContext())).toBe(0);
  });
});

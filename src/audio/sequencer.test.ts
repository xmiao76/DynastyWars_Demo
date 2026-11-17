import { describe, expect, test } from 'vitest';
import { SONG_IDS } from '../data/audio-ids';
import {
  advance,
  compile,
  compileSong,
  hold,
  noteFrequency,
  rest,
  songSeconds,
  stepSeconds,
  trackTokens,
  type CompiledSong,
  type InstrumentId,
  type NoteEvent,
  type Song,
  type Track,
} from './sequencer';
import { SONGS } from './songs';

/** 120 BPM in sixteenths: one step is exactly 0.125 s, one bar is 2 s. */
function songOf(tracks: readonly Track[], loop = true): Song {
  return { bpm: 120, stepsPerBeat: 4, beatsPerBar: 4, loop, tracks };
}

function track(instrument: InstrumentId, pattern: string, velocity = 0.5): Track {
  return { instrument, velocity, patterns: { p: pattern }, order: ['p'] };
}

function frequencyOf(event: NoteEvent): number {
  if (event.instrument === 'drums') throw new Error('expected a pitched event');
  return event.frequency;
}

describe('noteFrequency', () => {
  test('maps concert A to 440 Hz and octaves to doublings', () => {
    expect(noteFrequency('A4')).toBeCloseTo(440, 6);
    expect(noteFrequency('A5')).toBeCloseTo(880, 6);
    expect(noteFrequency('C4')).toBeCloseTo(261.626, 2);
  });

  test('treats sharps and flats as enharmonic neighbours', () => {
    expect(noteFrequency('Bb3')).toBeCloseTo(noteFrequency('A#3'), 9);
    expect(noteFrequency('Eb4')).toBeGreaterThan(noteFrequency('D4'));
  });

  test('throws on a malformed note name', () => {
    expect(() => noteFrequency('H2')).toThrow(/Invalid note/);
    expect(() => noteFrequency('A')).toThrow(/Invalid note/);
  });
});

describe('compile', () => {
  test('places notes on the step grid for a known tempo', () => {
    // Arrange
    const song = songOf([track('pluck', 'A4 . C5 - | . . E5 .')]);

    // Act
    const events = compile(song);

    // Assert
    expect(stepSeconds(song)).toBeCloseTo(0.125, 9);
    expect(events.map((event) => event.time)).toEqual([0, 0.25, 0.75]);
    expect(events.map((event) => event.duration)).toEqual([0.125, 0.25, 0.125]);
    expect(frequencyOf(events[0])).toBeCloseTo(440, 6);
  });

  test('returns events sorted by time across interleaved tracks', () => {
    const song = songOf([
      track('pluck', '. . . A4 . C5 . .'),
      track('bass', 'E2 - . . E2 . . E2'),
      track('drums', 'W . R . W W R .'),
    ]);

    const times = compile(song).map((event) => event.time);

    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(times).toHaveLength(10);
  });

  test('produces no events for rests', () => {
    const song = songOf([track('flute', rest(16)), track('drums', '. . . .')]);

    expect(compile(song)).toEqual([]);
  });

  test('extends a note for every hold, even across a pattern boundary', () => {
    const tied: Track = {
      instrument: 'flute',
      velocity: 0.5,
      patterns: { start: 'D5 - - -', carry: '- - . .' },
      order: ['start', 'carry'],
    };

    const events = compile(songOf([tied]));

    expect(events).toHaveLength(1);
    expect(events[0].duration).toBeCloseTo(6 * 0.125, 9);
  });

  test('ends a note that is still held when the song ends', () => {
    const events = compile(songOf([track('pad', hold('D2', 8))]));

    expect(events[0].duration).toBeCloseTo(1, 9);
  });

  test('emits one event per chord tone, all starting together', () => {
    const events = compile(songOf([track('pad', 'D2+A2 - . .')]));

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.time)).toEqual([0, 0]);
    expect(frequencyOf(events[1]) / frequencyOf(events[0])).toBeCloseTo(1.5, 2);
  });

  test('scales velocity for accents and soft notes and never exceeds 1', () => {
    const events = compile(songOf([track('pluck', 'A4 A4! A4?', 0.5)]));
    const loud = compile(songOf([track('pluck', 'A4!', 0.9)]));

    expect(events.map((event) => event.velocity)).toEqual([0.5, 0.65, 0.3]);
    expect(loud[0].velocity).toBe(1);
  });

  test('maps drum letters to drums, stacks hits and ghosts lower-case ones', () => {
    const events = compile(songOf([track('drums', 'WC . t G!', 0.8)]));

    expect(events.map((event) => (event.instrument === 'drums' ? event.drum : ''))).toEqual([
      'war',
      'cym',
      'tom',
      'gong',
    ]);
    expect(events.map((event) => event.time)).toEqual([0, 0, 0.25, 0.375]);
    expect(events[2].velocity).toBeCloseTo(0.4, 9);
    expect(events[3].velocity).toBe(1);
  });

  test('ignores bar lines and extra whitespace', () => {
    const plain = compile(songOf([track('bass', 'E2 . E2 . G2 . . .')]));
    const barred = compile(songOf([track('bass', '\n  E2 . E2 . |\n  G2 . . .  |')]));

    expect(barred).toEqual(plain);
  });

  test('fails fast on bad song data', () => {
    const missing: Track = { instrument: 'bass', velocity: 1, patterns: {}, order: ['nope'] };

    expect(() => compile(songOf([track('pluck', 'X9')]))).toThrow(/Invalid note/);
    expect(() => compile(songOf([track('pluck', '. - A4')]))).toThrow(/Hold without a note/);
    expect(() => compile(songOf([track('drums', 'W Q')]))).toThrow(/Unknown drum/);
    expect(() => compile(songOf([missing]))).toThrow(/Unknown pattern/);
  });

  test('does not modify the song it is given', () => {
    const song = songOf([track('pluck', 'A4 . C5 .')]);
    const snapshot = JSON.stringify(song);

    compile(song);

    expect(JSON.stringify(song)).toBe(snapshot);
  });
});

describe('song length', () => {
  test('is the longest track, so two bars at 120 BPM last 4 s', () => {
    const song = songOf([track('bass', rest(32)), track('drums', rest(16))]);

    expect(songSeconds(song)).toBeCloseTo(4, 9);
  });

  test('is carried into the compiled song with the loop flag', () => {
    const looping = compileSong(songOf([track('bass', 'E2 . . .')], true));
    const oneShot = compileSong(songOf([track('bass', 'E2 . . .')], false));

    expect(looping.length).toBeCloseTo(0.5, 9);
    expect(looping.loop).toBe(true);
    expect(oneShot.loop).toBe(false);
  });

  test('rest and hold helpers produce the requested number of steps', () => {
    expect(rest(3)).toBe('. . .');
    expect(hold('D2+A2', 4)).toBe('D2+A2 - - -');
  });
});

describe('advance', () => {
  const compiled = (loop: boolean): CompiledSong =>
    compileSong(songOf([track('pluck', 'A4 . C5 . E5 . . .')], loop));

  test('collects only the events that start before the horizon', () => {
    const step = advance(compiled(true), { index: 0, origin: 10 }, 10.3);

    expect(step.due.map((due) => due.when)).toEqual([10, 10.25]);
    expect(step.cursor).toEqual({ index: 2, origin: 10 });
    expect(step.finished).toBe(false);
  });

  test('schedules each event exactly once over successive calls', () => {
    const song = compiled(true);
    let cursor = { index: 0, origin: 0 };
    const seen: number[] = [];

    for (let until = 0.1; until < 3; until += 0.1) {
      const step = advance(song, cursor, until);
      cursor = step.cursor;
      seen.push(...step.due.map((due) => due.when));
    }

    expect(seen).toEqual([0, 0.25, 0.5, 1, 1.25, 1.5, 2, 2.25, 2.5]);
  });

  test('loops seamlessly: the next pass starts exactly one song length later', () => {
    const song = compiled(true);

    const step = advance(song, { index: 0, origin: 0 }, song.length + 0.01);

    expect(step.due.map((due) => due.when)).toEqual([0, 0.25, 0.5, 1]);
    expect(step.cursor).toEqual({ index: 1, origin: song.length });
    expect(step.finished).toBe(false);
  });

  test('finishes a one-shot song after its last event', () => {
    const step = advance(compiled(false), { index: 0, origin: 0 }, 100);

    expect(step.due).toHaveLength(3);
    expect(step.finished).toBe(true);
  });

  test('treats an empty song as finished instead of spinning', () => {
    const empty: CompiledSong = { events: [], length: 0, loop: true };

    expect(advance(empty, { index: 0, origin: 0 }, 100).finished).toBe(true);
  });
});

describe('the game songs', () => {
  const STEPS_PER_BAR = 16;
  const bars = (song: Song): number =>
    songSeconds(song) / stepSeconds(song) / (song.stepsPerBeat * song.beatsPerBar);

  test.each(SONG_IDS)('%s compiles to a non-empty, well-formed event list', (id) => {
    const song = SONGS[id];

    const events = compile(song);

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(Number.isFinite(event.time) && event.time >= 0).toBe(true);
      expect(event.time).toBeLessThan(songSeconds(song));
      expect(Number.isFinite(event.duration) && event.duration > 0).toBe(true);
      expect(event.velocity > 0 && event.velocity <= 1).toBe(true);
      if (event.instrument !== 'drums') {
        expect(Number.isFinite(event.frequency) && event.frequency > 0).toBe(true);
      }
    }
  });

  test.each(SONG_IDS)('%s has tracks of equal length in whole bars', (id) => {
    const lengths = SONGS[id].tracks.map((item) => trackTokens(item).length);

    expect(new Set(lengths).size).toBe(1);
    expect(lengths[0] % STEPS_PER_BAR).toBe(0);
  });

  test('looping themes meet their tempo and length briefs', () => {
    expect(SONGS.title.loop && SONGS.stage.loop && SONGS.boss.loop).toBe(true);
    expect(SONGS.title.bpm).toBe(80);
    expect(bars(SONGS.title)).toBeGreaterThanOrEqual(8);
    expect(SONGS.stage.bpm).toBe(150);
    expect(bars(SONGS.stage)).toBeGreaterThanOrEqual(16);
    expect(SONGS.boss.bpm).toBe(168);
    expect(bars(SONGS.boss)).toBeGreaterThanOrEqual(8);
  });

  test('jingles play once and last about as long as briefed', () => {
    expect(SONGS.clear.loop || SONGS.gameover.loop).toBe(false);
    expect(songSeconds(SONGS.clear)).toBeGreaterThan(4.5);
    expect(songSeconds(SONGS.clear)).toBeLessThan(5.5);
    expect(songSeconds(SONGS.gameover)).toBeGreaterThan(3.5);
    expect(songSeconds(SONGS.gameover)).toBeLessThan(4.5);
  });
});

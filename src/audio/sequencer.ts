/**
 * Tracker-style song data, the pure compiler that flattens it into timed note
 * events, and the lookahead scheduler that feeds those events to Web Audio.
 *
 * Step grammar (whitespace separated, `|` bar lines are ignored):
 *   pitched tracks  `A4` `C#5` `Eb3` note-on, `D2+A2` chord, `-` hold, `.` rest
 *   drum tracks     letters W T R C G (war drum, tom, rim, cymbal, gong);
 *                   several letters stack on one step; lower case is a ghost hit
 *   any note / hit  a trailing `!` accents it, a trailing `?` softens it
 */

export type PitchedInstrumentId = 'pluck' | 'flute' | 'bass' | 'pad' | 'horn';
export type DrumId = 'war' | 'tom' | 'rim' | 'cym' | 'gong';
export type InstrumentId = PitchedInstrumentId | 'drums';

export interface Track {
  readonly instrument: InstrumentId;
  /** Base velocity (0..1) of every note on the track. */
  readonly velocity: number;
  /** Named step patterns; see the grammar at the top of this file. */
  readonly patterns: Readonly<Record<string, string>>;
  /** Pattern names in playback order. */
  readonly order: readonly string[];
}

export interface Song {
  readonly bpm: number;
  readonly stepsPerBeat: number;
  readonly beatsPerBar: number;
  /** Looping songs repeat seamlessly; the others play once. */
  readonly loop: boolean;
  readonly tracks: readonly Track[];
}

interface EventBase {
  /** Seconds from the start of the song. */
  readonly time: number;
  /** Seconds the note is held. */
  readonly duration: number;
  readonly velocity: number;
}

export interface PitchedEvent extends EventBase {
  readonly instrument: PitchedInstrumentId;
  readonly frequency: number;
}

export interface DrumEvent extends EventBase {
  readonly instrument: 'drums';
  readonly drum: DrumId;
}

export type NoteEvent = PitchedEvent | DrumEvent;

export interface CompiledSong {
  readonly events: readonly NoteEvent[];
  /** Seconds; also the loop period of a looping song. */
  readonly length: number;
  readonly loop: boolean;
}

const REST_TOKEN = '.';
const HOLD_TOKEN = '-';
const BAR_TOKEN = '|';
const CHORD_JOINER = '+';
const ACCENT_MARK = '!';
const SOFT_MARK = '?';
const ACCENT_GAIN = 1.3;
const SOFT_GAIN = 0.6;
const GHOST_GAIN = 0.5;
const MAX_VELOCITY = 1;

const SECONDS_PER_MINUTE = 60;
const A4_HZ = 440;
const A4_MIDI = 69;
const SEMITONES_PER_OCTAVE = 12;
const NOTE_PATTERN = /^([A-G])([#b]?)(\d)$/;
const SEMITONE_OF: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const DRUM_OF: Readonly<Partial<Record<string, DrumId>>> = {
  W: 'war',
  T: 'tom',
  R: 'rim',
  C: 'cym',
  G: 'gong',
};

/** `steps` rest tokens, for the silent stretches of a track. */
export function rest(steps: number): string {
  return Array.from({ length: steps }, () => REST_TOKEN).join(' ');
}

/** `token` sustained for `steps` steps in total. */
export function hold(token: string, steps: number): string {
  return [token, ...Array.from({ length: steps - 1 }, () => HOLD_TOKEN)].join(' ');
}

/** Equal-tempered frequency of a note name such as `A4`, `C#5` or `Eb3`. */
export function noteFrequency(name: string): number {
  const match = NOTE_PATTERN.exec(name);
  if (match === null) throw new Error(`Invalid note name "${name}"`);
  const [, letter, accidental, octave] = match;
  const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  const midi = (Number(octave) + 1) * SEMITONES_PER_OCTAVE + SEMITONE_OF[letter] + shift;
  return A4_HZ * 2 ** ((midi - A4_MIDI) / SEMITONES_PER_OCTAVE);
}

export function stepSeconds(song: Song): number {
  return SECONDS_PER_MINUTE / song.bpm / song.stepsPerBeat;
}

/** The track's patterns laid end to end as step tokens. */
export function trackTokens(track: Track): readonly string[] {
  return track.order.flatMap((name) => {
    const pattern: string | undefined = track.patterns[name];
    if (pattern === undefined) {
      throw new Error(`Unknown pattern "${name}" on the ${track.instrument} track`);
    }
    return pattern.split(/\s+/).filter((token) => token !== '' && token !== BAR_TOKEN);
  });
}

/** Length of the song in seconds (its longest track). */
export function songSeconds(song: Song): number {
  const steps = song.tracks.reduce((most, track) => Math.max(most, trackTokens(track).length), 0);
  return steps * stepSeconds(song);
}

interface Accented {
  readonly body: string;
  readonly gain: number;
}

function splitAccent(token: string): Accented {
  if (token.endsWith(ACCENT_MARK)) return { body: token.slice(0, -1), gain: ACCENT_GAIN };
  if (token.endsWith(SOFT_MARK)) return { body: token.slice(0, -1), gain: SOFT_GAIN };
  return { body: token, gain: 1 };
}

interface OpenNote {
  readonly startStep: number;
  readonly frequencies: readonly number[];
  readonly velocity: number;
}

function openNote(token: string, startStep: number, trackVelocity: number): OpenNote {
  const { body, gain } = splitAccent(token);
  return {
    startStep,
    frequencies: body.split(CHORD_JOINER).map(noteFrequency),
    velocity: Math.min(MAX_VELOCITY, trackVelocity * gain),
  };
}

function closeNote(
  note: OpenNote,
  endStep: number,
  step: number,
  instrument: PitchedInstrumentId,
): PitchedEvent[] {
  return note.frequencies.map((frequency) => ({
    instrument,
    frequency,
    time: note.startStep * step,
    duration: (endStep - note.startStep) * step,
    velocity: note.velocity,
  }));
}

function compilePitched(
  tokens: readonly string[],
  instrument: PitchedInstrumentId,
  velocity: number,
  step: number,
): PitchedEvent[] {
  const events: PitchedEvent[] = [];
  let open: OpenNote | null = null;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === HOLD_TOKEN) {
      if (open === null) throw new Error(`Hold without a note at step ${index} (${instrument})`);
      continue;
    }
    if (open !== null) events.push(...closeNote(open, index, step, instrument));
    open = token === REST_TOKEN ? null : openNote(token, index, velocity);
  }
  if (open !== null) events.push(...closeNote(open, tokens.length, step, instrument));
  return events;
}

function compileDrums(tokens: readonly string[], velocity: number, step: number): DrumEvent[] {
  const events: DrumEvent[] = [];
  tokens.forEach((token, index) => {
    if (token === REST_TOKEN) return;
    const { body, gain } = splitAccent(token);
    for (const letter of body) {
      const drum = DRUM_OF[letter.toUpperCase()];
      if (drum === undefined) throw new Error(`Unknown drum "${letter}" in step "${token}"`);
      const ghost = letter === letter.toUpperCase() ? 1 : GHOST_GAIN;
      events.push({
        instrument: 'drums',
        drum,
        time: index * step,
        duration: step,
        velocity: Math.min(MAX_VELOCITY, velocity * gain * ghost),
      });
    }
  });
  return events;
}

function compileTrack(track: Track, step: number): NoteEvent[] {
  const tokens = trackTokens(track);
  return track.instrument === 'drums'
    ? compileDrums(tokens, track.velocity, step)
    : compilePitched(tokens, track.instrument, track.velocity, step);
}

/** Flatten a song into note events sorted by start time. Pure. */
export function compile(song: Song): readonly NoteEvent[] {
  const step = stepSeconds(song);
  const events = song.tracks.flatMap((track) => compileTrack(track, step));
  return events.sort((a, b) => a.time - b.time);
}

export function compileSong(song: Song): CompiledSong {
  return { events: compile(song), length: songSeconds(song), loop: song.loop };
}

/** Playback position: the next event to schedule and when its loop pass began. */
export interface PlayCursor {
  readonly index: number;
  /** Clock time at which the current pass through the song started. */
  readonly origin: number;
}

export interface DueEvent {
  readonly event: NoteEvent;
  /** Clock time at which the event sounds. */
  readonly when: number;
}

export interface Advance {
  readonly due: readonly DueEvent[];
  readonly cursor: PlayCursor;
  /** True once a one-shot song has nothing left to schedule. */
  readonly finished: boolean;
}

/** Collect every event that starts before `until`, wrapping looping songs. Pure. */
export function advance(song: CompiledSong, cursor: PlayCursor, until: number): Advance {
  const due: DueEvent[] = [];
  if (song.events.length === 0 || song.length <= 0) return { due, cursor, finished: true };
  let { index, origin } = cursor;
  for (;;) {
    if (index >= song.events.length) {
      if (!song.loop) return { due, cursor: { index, origin }, finished: true };
      index = 0;
      origin += song.length;
    }
    const event = song.events[index];
    const when = origin + event.time;
    if (when >= until) break;
    due.push({ event, when });
    index += 1;
  }
  return { due, cursor: { index, origin }, finished: false };
}

/** Sounds one event on `out` at clock time `when`. */
export type TriggerFn = (out: AudioNode, event: NoteEvent, when: number) => void;

export interface Sequencer {
  /** Start `song` from its beginning, replacing whatever was playing. */
  play(song: CompiledSong): void;
  stop(): void;
}

const TICK_MS = 25;
const HORIZON_S = 0.12;
const START_DELAY_S = 0.06;
/** Events this far behind the clock (a stalled timer) are dropped, not bunched up. */
const LATE_TOLERANCE_S = 0.03;
const FADE_TIME_CONSTANT_S = 0.03;
const FADE_DISCONNECT_MS = 400;

/** Fade a finished song's voices out, then detach them from the graph. */
function releaseBus(ctx: BaseAudioContext, bus: GainNode): void {
  if (ctx.state !== 'running') {
    bus.disconnect();
    return;
  }
  bus.gain.setTargetAtTime(0, ctx.currentTime, FADE_TIME_CONSTANT_S);
  setTimeout(() => bus.disconnect(), FADE_DISCONNECT_MS);
}

/** Lookahead scheduler: a coarse timer queues events on the sample-accurate clock. */
export function createSequencer(
  ctx: BaseAudioContext,
  output: AudioNode,
  trigger: TriggerFn,
): Sequencer {
  let timer: ReturnType<typeof setInterval> | null = null;
  let songBus: GainNode | null = null;

  const stopTimer = (): void => {
    if (timer === null) return;
    clearInterval(timer);
    timer = null;
  };

  const stop = (): void => {
    stopTimer();
    if (songBus === null) return;
    releaseBus(ctx, songBus);
    songBus = null;
  };

  const play = (song: CompiledSong): void => {
    stop();
    const bus = ctx.createGain();
    bus.connect(output);
    songBus = bus;
    let cursor: PlayCursor = { index: 0, origin: ctx.currentTime + START_DELAY_S };
    const tick = (): void => {
      const now = ctx.currentTime;
      const step = advance(song, cursor, now + HORIZON_S);
      cursor = step.cursor;
      for (const { event, when } of step.due) {
        if (when >= now - LATE_TOLERANCE_S) trigger(bus, event, Math.max(when, now));
      }
      if (step.finished) stopTimer();
    };
    timer = setInterval(tick, TICK_MS);
    tick();
  };

  return { play, stop };
}

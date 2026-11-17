/**
 * Audio audition page (dev only, served by Vite at /dev/sfx.html).
 * Buttons for every sound effect and song, plus a "measure" tool that renders
 * everything offline and prints peak / RMS levels, for checking the mix by
 * numbers as well as by ear.
 */
import { createAudioEngine } from '../src/audio';
import { MIX } from '../src/audio/engine';
import { playEvent } from '../src/audio/instruments';
import { compile, songSeconds, type NoteEvent } from '../src/audio/sequencer';
import { SFX_RECIPES } from '../src/audio/sfx-recipes';
import { renderRecipe } from '../src/audio/sfx-render';
import { SONGS } from '../src/audio/songs';
import { SFX_IDS, SONG_IDS, type SfxId, type SongId } from '../src/data/audio-ids';

const MEASURE_RATE = 44100;
/** Extra seconds rendered after a song ends, so ringing notes are measured too. */
const SONG_TAIL_S = 2;
const WINDOW_S = 8;
const PREROLL_S = 1.5;
const MIN_PEAK = 0.05;
const SILENCE_DB = -120;
const NAME_WIDTH = 16;

interface Level {
  readonly name: string;
  readonly seconds: number;
  readonly peakDb: number;
  readonly rmsDb: number;
}

const engine = createAudioEngine();

function toDb(amplitude: number): number {
  return amplitude > 0 ? 20 * Math.log10(amplitude) : SILENCE_DB;
}

/** Peak and RMS of `data` after applying `gain`, in dBFS. */
function levelOf(name: string, data: Float32Array, gain: number, sampleRate: number): Level {
  let peak = 0;
  let squares = 0;
  for (let i = 0; i < data.length; i += 1) {
    peak = Math.max(peak, Math.abs(data[i]));
    squares += data[i] * data[i];
  }
  return {
    name,
    seconds: data.length / sampleRate,
    peakDb: toDb(peak * gain),
    rmsDb: toDb(Math.sqrt(squares / Math.max(1, data.length)) * gain),
  };
}

/** Level of an effect at the master bus, as the player would normalise it. */
async function measureSfx(id: SfxId): Promise<Level | null> {
  const recipe = SFX_RECIPES[id];
  const rendered = await renderRecipe(recipe, MEASURE_RATE);
  if (rendered === null) return null;
  const gain = (recipe.level / Math.max(rendered.peak, MIN_PEAK)) * MIX.sfx * MIX.master;
  return levelOf(id, rendered.buffer.getChannelData(0), gain, MEASURE_RATE);
}

/** Render the notes that start in `from..to` seconds of a song (times are song time). */
async function renderWindow(
  events: readonly NoteEvent[],
  from: number,
  to: number,
): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(1, Math.ceil((to - from) * MEASURE_RATE), MEASURE_RATE);
  for (const event of events) {
    if (event.time >= from && event.time < to) {
      playEvent(ctx, ctx.destination, event, event.time - from);
    }
  }
  return (await ctx.startRendering()).getChannelData(0);
}

/**
 * Level of one full pass of a song at the master bus. The song is rendered in
 * short windows (an offline graph holding a whole song's nodes is very slow);
 * each window is preceded by a pre-roll so notes still ringing are included.
 */
async function measureSong(id: SongId): Promise<Level> {
  const song = SONGS[id];
  const events = compile(song);
  const total = songSeconds(song) + SONG_TAIL_S;
  const pieces: Float32Array[] = [];
  for (let start = 0; start < total; start += WINDOW_S) {
    const from = Math.max(0, start - PREROLL_S);
    const data = await renderWindow(events, from, Math.min(total, start + WINDOW_S));
    pieces.push(data.subarray(Math.floor((start - from) * MEASURE_RATE)));
  }
  const whole = new Float32Array(pieces.reduce((length, piece) => length + piece.length, 0));
  pieces.reduce((offset, piece) => {
    whole.set(piece, offset);
    return offset + piece.length;
  }, 0);
  return levelOf(id, whole, MIX.music * MIX.master, MEASURE_RATE);
}

function formatLevel(level: Level): string {
  const cells = [level.seconds.toFixed(2), level.peakDb.toFixed(1), level.rmsDb.toFixed(1)];
  return `${level.name.padEnd(NAME_WIDTH)}${cells.map((cell) => cell.padStart(8)).join('')}`;
}

async function measureAll(output: HTMLElement): Promise<void> {
  const header = `${'name'.padEnd(NAME_WIDTH)}${['sec', 'peak dB', 'rms dB'].map((cell) => cell.padStart(8)).join('')}`;
  const lines = ['Levels at the master bus, before the limiter (dBFS)', header];
  try {
    for (const id of SONG_IDS) {
      output.textContent = `Rendering ${id}…`;
      lines.push(formatLevel(await measureSong(id)));
    }
    for (const id of SFX_IDS) {
      const level = await measureSfx(id);
      lines.push(level === null ? `${id.padEnd(NAME_WIDTH)} (not rendered)` : formatLevel(level));
    }
    output.textContent = lines.join('\n');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    output.textContent = `Offline rendering failed: ${reason}`;
  }
}

function button(label: string, onClick: () => void): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.addEventListener('click', () => {
    engine.unlock();
    onClick();
  });
  return element;
}

function checkbox(label: string, checked: boolean, onChange: (on: boolean) => void): HTMLElement {
  const wrapper = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  wrapper.append(input, ` ${label}`);
  return wrapper;
}

function section(title: string, children: readonly HTMLElement[]): HTMLElement {
  const wrapper = document.createElement('section');
  const heading = document.createElement('h2');
  const row = document.createElement('div');
  heading.textContent = title;
  row.className = 'row';
  row.append(...children);
  wrapper.append(heading, row);
  return wrapper;
}

function build(root: HTMLElement): void {
  const levels = document.createElement('pre');
  levels.textContent = 'Press "Measure levels" to render every song and effect offline.';
  root.append(
    section('Controls', [
      checkbox('Mute', engine.isMuted(), (on) => engine.setMuted(on)),
      checkbox('Suspend', false, (on) => engine.setSuspended(on)),
    ]),
    section('Songs', [
      ...SONG_IDS.map((id) => button(id, () => engine.playSong(id))),
      button('Stop', () => engine.playSong(null)),
    ]),
    section(
      'Sound effects',
      SFX_IDS.map((id) => button(id, () => engine.playSfx(id))),
    ),
    section('Levels', [button('Measure levels', () => void measureAll(levels))]),
    levels,
  );
}

const root = document.getElementById('root');
if (root !== null) build(root);

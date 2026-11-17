/**
 * Boss theme: "The Admiral's Deck". Original composition.
 * 168 BPM, 16 bars (about 23 s), C yu (C Eb F G Bb).
 *   A  a low galloping pluck riff over a rolling 3+3+2 war-drum ostinato,
 *      with dark horn stabs
 *   B  the horn climbs in long notes over a 3+3+2 pluck figure while the bass
 *      rises C, Eb, F, G and the drums hammer straight eighths
 */
import { rest, type Song } from '../sequencer';

const BAR_STEPS = 16;

const LEAD = {
  riff: `
    C4 - C4 C4  Eb4 - C4 -   F4 - Eb4 C4   Bb3 - C4 -   |
    C4 - C4 C4  Eb4 - C4 -   G4 - F4 Eb4   F4 - - -     |
    C4 - C4 C4  Eb4 - C4 -   F4 - Eb4 C4   Bb3 - C4 -   |
    G4 - G4 G4  Bb4 - G4 -   C5 - Bb4 G4   F4 - Eb4 -   |
    C5 - C5 C5  Eb5 - C5 -   F5 - Eb5 C5   Bb4 - C5 -   |
    C5 - C5 C5  Eb5 - C5 -   G5 - F5 Eb5   F5 - - -     |
    G5 - F5 Eb5 F5 - Eb5 C5  Eb5 - C5 Bb4  C5 - Bb4 G4  |
    Bb4 - - -   C5 - - -     . . G4 Bb4    C5 - . .     |`,
  onC: 'C4 - - Eb4  - - G4 -  C5 - - G4  - - Eb4 -',
  onEb: 'Eb4 - - G4  - - Bb4 -  Eb5 - - Bb4  - - G4 -',
  onF: 'F4 - - Bb4  - - C5 -  F5 - - C5  - - Bb4 -',
  onG: 'G4 - - Bb4  - - C5 -  G5 - - F5  - - C5 -',
  descent: 'G5 - F5 Eb5  C5 - Bb4 G4  F4 - Eb4 C4  Bb3 - Bb3 Bb3',
};

const HORN = {
  stabs: `
    C3 - - -    - - . .     . . . .     . . . .    |
    ${rest(BAR_STEPS)}                              |
    C3 - - -    - - . .     . . . .     . . . .    |
    G3 - - -    - - - -     - - - -     F3 - Eb3 - |
    C3 - - -    - - . .     . . . .     . . . .    |
    ${rest(BAR_STEPS)}                              |
    G3 - - -    F3 - - -    Eb3 - - -   C3 - - -   |
    Bb2 - - -   C3 - - -    - - . .     . . . .    |`,
  climb: `
    C5 - - -    - - - -     - - Bb4 -   C5 - - -   |
    Eb5 - - -   - - - -     - - - -     . . . .    |
    Eb5 - - -   - - - -     - - F5 -    G5 - - -   |
    Bb5 - - -   - - - -     G5 - - -    - - . .    |
    F5 - - -    - - - -     - - G5 -    Bb5 - - -  |
    C6 - - -    - - - -     Bb5 - - -   G5 - - -   |
    G5 - - -    - - F5 -    G5 - - -    Bb5 - - -  |
    G5 - - -    - - - -     G5 - G5 G5  Bb5 - - -  |`,
};

const BASS = {
  c: 'C2 - C2 C2  C3 - C2 -  C2 - C2 C2  Bb2 - C3 -',
  cRise: 'C2 - C2 C2  C3 - C2 -  Eb2 - Eb2 Eb2  F2 - F2 -',
  g: 'G2 - G2 G2  G3 - G2 -  G2 - G2 G2  F2 - Eb2 -',
  fall: 'G2 - G2 G2  F2 - F2 F2  Eb2 - Eb2 Eb2  C2 - C2 C2',
  turn: 'Bb2 - Bb2 Bb2  C3 - C3 C3  C2 - - -  G2 - Bb2 -',
  pedalC: 'C2 - C2 C2  C2 - C3 C2  C2 - C2 C2  C2 - C3 C2',
  pedalEb: 'Eb2 - Eb2 Eb2  Eb2 - Eb3 Eb2  Eb2 - Eb2 Eb2  Eb2 - Eb3 Eb2',
  pedalF: 'F2 - F2 F2  F2 - F3 F2  F2 - F2 F2  F2 - F3 F2',
  pedalG: 'G2 - G2 G2  G2 - G3 G2  G2 - G2 G2  G2 - G3 G2',
  pedalGEnd: 'G2 - G2 G2  G2 - G3 G2  G2 - G2 G2  Bb2 - Bb2 Bb2',
};

const DRUMS = {
  roll: 'W w w W  R w W w  W w w W  R w W w',
  rollCym: 'WC w w W  R w W w  W w w W  R w W w',
  rollFill: 'W w w W  R w W w  T T t t  T! T! WC! .',
  drive: 'W . W w  W . W w  W . W w  W . W w',
  driveGong: 'WG . W w  W . W w  W . W w  W . W w',
  driveRim: 'W . W w  R . W w  W . W w  R . W w',
  charge: 'W w W w  W w W w  T T T T  T! T! W! W!',
};

export const BOSS_SONG: Song = {
  bpm: 168,
  stepsPerBeat: 4,
  beatsPerBar: 4,
  loop: true,
  tracks: [
    {
      instrument: 'pluck',
      velocity: 0.9,
      patterns: LEAD,
      order: ['riff', 'onC', 'onC', 'onEb', 'onEb', 'onF', 'onF', 'onG', 'descent'],
    },
    { instrument: 'horn', velocity: 0.8, patterns: HORN, order: ['stabs', 'climb'] },
    {
      instrument: 'bass',
      velocity: 0.85,
      patterns: BASS,
      order: [
        ...['c', 'cRise', 'c', 'g', 'c', 'cRise', 'fall', 'turn'],
        ...['pedalC', 'pedalC', 'pedalEb', 'pedalEb', 'pedalF', 'pedalF', 'pedalG', 'pedalGEnd'],
      ],
    },
    {
      instrument: 'drums',
      velocity: 0.85,
      patterns: DRUMS,
      order: [
        ...['rollCym', 'roll', 'roll', 'roll', 'rollCym', 'roll', 'roll', 'rollFill'],
        ...['driveGong', 'drive', 'driveRim', 'drive', 'driveGong', 'driveRim', 'driveRim', 'charge'],
      ],
    },
  ],
};

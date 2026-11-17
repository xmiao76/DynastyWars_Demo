/**
 * Stage theme: "Fire on the River". Original composition.
 * 150 BPM, 48 bars (about 77 s) so the loop does not grate over a long stage:
 *   A1  pluck theme in E yu (E G A B D) over galloping war drums
 *   A2  the theme varied and pushed up an octave, flute long tones above it
 *   B1  the same five notes re-centred on G (gong mode): a broad flute tune
 *       over plucked arpeggios and lighter drums
 *   B2  the flute tune again with the pluck doubling it in gallop tremolo
 *   C   breakdown in A yu (A C D E G): riff and answer over toms, building
 *   A3  the theme once more with the flute shadowing it (heterophony)
 */
import { rest, type Song } from '../sequencer';

const SECTION_STEPS = 128;
const SILENT_SECTION = rest(SECTION_STEPS);

const LEAD = {
  a1: `
    E5 - - B4   D5 - E5 -   G5 - - E5   D5 - B4 -  |
    A4 - - -    - - B4 D5   E5 - - -    - - . .    |
    G5 - - E5   G5 - A5 -   B5 - - A5   G5 - E5 -  |
    D5 - - -    - - E5 G5   B5 - - -    - - . .    |
    B5 - A5 G5  A5 - G5 E5  G5 - E5 D5  E5 - D5 B4 |
    A4 - B4 D5  E5 - - -    D5 - E5 G5  A5 - - -   |
    B5 - - A5   G5 - E5 -   D5 - E5 G5  E5 - D5 B4 |
    E5 - - -    - - - -     E4 - E4 E4  B4 - D5 -  |`,
  a2: `
    E5 - - B4   D5 - E5 G5  A5 - - G5   E5 - D5 -  |
    A4 - - B4   A4 - B4 D5  E5 - - -    - - D5 E5  |
    G5 - - E5   G5 - A5 B5  D6 - - B5   A5 - G5 -  |
    A5 - - -    - - G5 A5   B5 - - -    - - . .    |
    E6 - D6 B5  D6 - B5 A5  B5 - A5 G5  A5 - G5 E5 |
    G5 - - E5   D5 - E5 G5  A5 - - -    B5 - - -   |
    D6 - - B5   A5 - G5 -   A5 - B5 D6  B5 - A5 G5 |
    E5 - - -    - - - -     . . D5 E5   G5 - A5 -  |`,
  b2: `
    B4 - B4 B4  B4 - B4 B4  A4 - A4 A4  G4 - G4 G4 |
    A4 - A4 A4  A4 - B4 -   D5 - D5 D5  D5 - D5 D5 |
    E5 - E5 E5  E5 - D5 -   B4 - B4 B4  A4 - G4 -  |
    A4 - A4 A4  A4 - A4 A4  A4 - - -    D5 - E5 -  |
    B4 - B4 B4  B4 - B4 B4  D5 - D5 D5  E5 - E5 E5 |
    G5 - G5 G5  G5 - E5 -   D5 - D5 D5  B4 - B4 B4 |
    A4 - A4 A4  B4 - A4 -   G4 - G4 G4  E4 - E4 E4 |
    G4 - G4 G4  G4 - G4 G4  G4 - - -    . . . .    |`,
  c: `
    A4 - C5 D5  E5 - - -    D5 - C5 A4  C5 - - -   |
    A4 - C5 D5  E5 - G5 -   E5 - - -    . . . .    |
    . . . .     . . . .     . . . .     . . . .    |
    . . . .     . . . .     . . . .     E5 - G5 -  |
    A5 - C6 D6  E6 - - -    D6 - C6 A5  C6 - - -   |
    A5 - C6 D6  E6 - G6 -   E6 - D6 C6  A5 - - -   |
    E5 - G5 C6  G5 - C6 E6  D5 - A5 D6  A5 - D6 E6 |
    B5 - - -    - - - -     B4 - B4 B4  D5 - D5 -  |`,
  silent: SILENT_SECTION,
};

const COMP = {
  b1: `
    G4 . D5 G4  B4 . D5 .   G4 . D5 G4  B4 . D5 .  |
    D4 . A4 D4  E4 . A4 .   D4 . A4 D4  E4 . A4 .  |
    E4 . B4 E4  G4 . B4 .   E4 . B4 E4  G4 . B4 .  |
    D4 . A4 D4  E4 . A4 .   D4 . A4 D4  E4 . A4 .  |
    G4 . D5 G4  B4 . D5 .   G4 . D5 G4  B4 . D5 .  |
    E4 . B4 E4  G4 . B4 .   E4 . B4 E4  G4 . B4 .  |
    A3 . E4 A3  B3 . E4 .   D4 . A4 D4  E4 . A4 .  |
    G4 . D5 G4  B4 . D5 .   G4 . D5 .   . . . .    |`,
  silent: SILENT_SECTION,
};

const FLUTE = {
  a2: `
    B5? - - -   - - - -     - - - -     - - - -    |
    A5? - - -   - - - -     G5? - - -   - - - -    |
    D6? - - -   - - - -     - - - -     B5? - - -  |
    A5? - - -   - - - -     B5? - - -   - - . .    |
    G5? - - -   - - - -     E5? - - -   - - - -    |
    E5? - - -   - - - -     A5? - - -   - - - -    |
    G5? - - -   - - - -     B5? - - -   - - - -    |
    B5? - - -   - - - -     - - - -     . . . .    |`,
  b: `
    B5 - - -    - - - -     A5 - - -    G5 - - -   |
    A5 - - -    - - B5 -    D6 - - -    - - - -    |
    E6 - - -    - - D6 -    B5 - - -    A5 - G5 -  |
    A5 - - -    - - - -     - - - -     . . . .    |
    B5 - - -    - - - -     D6 - - -    E6 - - -   |
    G6 - - -    - - E6 -    D6 - - -    B5 - - -   |
    A5 - - -    B5 - A5 -   G5 - - -    E5 - - -   |
    G5 - - -    - - - -     - - - -     . . . .    |`,
  c: `
    . . . .     . . . .     . . . .     . . . .    |
    . . . .     . . . .     . . . .     . . . .    |
    . . . .     D6 - - -    - - E6 D6   C6 - A5 -  |
    G5 - - -    - - - -     - - - -     . . . .    |
    . . . .     . . . .     . . . .     . . . .    |
    . . . .     . . . .     . . . .     . . . .    |
    G5 - - -    - - - -     A5 - - -    - - - -    |
    B5 - - -    - - - -     - - - -     D6 - - -   |`,
  a3: `
    E5 - - -    D5 - E5 -   G5 - - -    D5 - B4 -  |
    A4 - - -    - - B4 D5   E5 - - -    - - . .    |
    G5 - - -    G5 - A5 -   B5 - - -    G5 - E5 -  |
    D5 - - -    - - E5 G5   B5 - - -    - - . .    |
    B5 - - -    A5 - - -    G5 - - -    E5 - - -   |
    A4 - - -    E5 - - -    D5 - - -    A5 - - -   |
    B5 - - -    G5 - E5 -   D5 - - -    E5 - D5 -  |
    E5 - - -    - - - -     - - - -     . . . .    |`,
  silent: SILENT_SECTION,
};

const BASS = {
  // Galloping roots for the A sections (E yu).
  e: 'E2 - E2 E2  E2 - E3 E2  E2 - E2 E2  E2 - D3 E3',
  de: 'D2 - D2 D2  D2 - D3 D2  E2 - E2 E2  E2 - E3 E2',
  g: 'G2 - G2 G2  G2 - G3 G2  G2 - G2 G2  G2 - D3 G2',
  ge: 'G2 - G2 G2  G2 - G3 G2  E2 - E2 E2  E2 - E3 E2',
  ad: 'A2 - A2 A2  A2 - A3 A2  D2 - D2 D2  D2 - D3 D2',
  eb: 'E2 - E2 E2  E2 - E3 E2  B2 - B2 B2  B2 - B2 D3',
  eEnd: 'E2 - E2 E2  E2 - E3 E2  E2 - E2 E2  B2 - D3 -',
  d: 'D2 - D2 D2  D2 - D3 D2  D2 - D2 D2  D2 - A2 D3',
  gEnd: 'G2 - G2 G2  G2 - G3 G2  G2 - - -    E2 - G2 -',
  // Broad roots for B1 (G gong).
  wideG: 'G2 - - -    - - G2 -    D3 - - -    G2 - D3 -',
  wideD: 'D3 - - -    - - D3 -    A2 - - -    D3 - A2 -',
  wideE: 'E2 - - -    - - E2 -    B2 - - -    E2 - B2 -',
  wideAd: 'A2 - - -    - - A2 -    D3 - - -    D3 - A2 -',
  wideGEnd: 'G2 - - -    - - G2 -    D3 - - -    D3 - E3 -',
  // Syncopated riff for the breakdown (A yu), then the push back to E.
  riffA: 'A2 - - A2   - - A2 -    . . A2 -    C3 - D3 -',
  riffG: 'G2 - - G2   - - G2 -    . . G2 -    D3 - E3 -',
  cd: 'C3 - C3 C3  C3 - C3 C3  D3 - D3 D3  D3 - D3 D3',
  b: 'B2 - B2 B2  B2 - B2 B2  B2 - B2 B2  B2 B2 B2 B2',
};

const BASS_A = ['e', 'de', 'g', 'de', 'ge', 'ad', 'eb', 'eEnd'];

const DRUMS = {
  gallop: 'W . w w  R . w w  W . w w  R . w w',
  gallopTom: 'W . w w  R . w w  W . W w  R . T t',
  gallopCym: 'WC . w w  R . w w  W . w w  R . w w',
  gallopFill: 'W . w w  R . w w  T T t t  T! T C! .',
  light: 'W . . r  R . r .  W . w .  R . r r',
  lightTom: 'W . . r  R . r .  W . w .  R . T t',
  lightCym: 'WC . . r  R . r .  W . w .  R . r r',
  toms: 'W . . W  . . T .  W . . W  . T T .',
  tomsRoll: 'W . . W  . . T .  W . . W  T t T t',
  build: 'W w w w  T t t t  W w T t  W! T! C! .',
};

export const STAGE_SONG: Song = {
  bpm: 150,
  stepsPerBeat: 4,
  beatsPerBar: 4,
  loop: true,
  tracks: [
    {
      instrument: 'pluck',
      velocity: 0.9,
      patterns: LEAD,
      order: ['a1', 'a2', 'silent', 'b2', 'c', 'a1'],
    },
    {
      instrument: 'pluck',
      velocity: 0.5,
      patterns: COMP,
      order: ['silent', 'silent', 'b1', 'silent', 'silent', 'silent'],
    },
    {
      instrument: 'flute',
      velocity: 0.8,
      patterns: FLUTE,
      order: ['silent', 'a2', 'b', 'b', 'c', 'a3'],
    },
    {
      instrument: 'bass',
      velocity: 0.8,
      patterns: BASS,
      order: [
        ...BASS_A,
        ...BASS_A,
        ...['wideG', 'wideD', 'wideE', 'wideD', 'wideG', 'wideE', 'wideAd', 'wideGEnd'],
        ...['g', 'd', 'e', 'd', 'g', 'e', 'ad', 'gEnd'],
        ...['riffA', 'riffA', 'riffG', 'riffG', 'riffA', 'riffA', 'cd', 'b'],
        ...BASS_A,
      ],
    },
    {
      instrument: 'drums',
      velocity: 0.85,
      patterns: DRUMS,
      order: [
        ...['gallopCym', 'gallop', 'gallop', 'gallopTom', 'gallop', 'gallop', 'gallop', 'gallopFill'],
        ...['gallopCym', 'gallop', 'gallop', 'gallopTom', 'gallopCym', 'gallop', 'gallop', 'gallopFill'],
        ...['lightCym', 'light', 'light', 'lightTom', 'light', 'light', 'light', 'lightTom'],
        ...['gallopCym', 'gallop', 'gallop', 'gallopTom', 'gallopCym', 'gallop', 'gallop', 'gallopFill'],
        ...['toms', 'toms', 'toms', 'tomsRoll', 'toms', 'toms', 'tomsRoll', 'build'],
        ...['gallopCym', 'gallop', 'gallop', 'gallopTom', 'gallopCym', 'gallop', 'gallopTom', 'gallopFill'],
      ],
    },
  ],
};

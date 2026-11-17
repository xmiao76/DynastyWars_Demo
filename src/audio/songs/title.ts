/**
 * Title theme: "Before the Wind Turns". Original composition.
 * 80 BPM, 16 bars (48 s). A lone flute in D yu (D F G A C) over a slow drone
 * that drifts between open fifths, a heartbeat of war drum and gong, and
 * guzheng-like runs that answer the end of each four-bar phrase.
 */
import { hold, rest, type Song } from '../sequencer';

const BAR_STEPS = 16;
const DRONE_STEPS = BAR_STEPS * 2;

const FLUTE = `
  . . . .     . . . .     A4 - - -    C5 - D5 -  |
  D5 - - -    - - - -     - - C5 -    A4 - - -   |
  G4 - - -    - - A4 -    C5 - - -    D5 - F5 -  |
  D5 - - -    - - - -     - - - -     . . . .    |
  F5 - - -    - - G5 -    A5 - - -    - - - -    |
  C6 - - -    - - A5 -    G5 - - F5   G5 - - -   |
  A5 - - -    - - G5 F5   D5 - - -    C5 - D5 -  |
  A4 - - -    - - - -     - - - -     . . . .    |
  D5 - - -    - - F5 -    G5 - - -    A5 - - -   |
  C6 - - -    - - - -     D6 - - -    - - C6 A5  |
  G5 - - -    A5 - G5 F5  D5 - - -    - - - -    |
  F5 - - -    D5 - C5 -   D5 - - -    - - - -    |
  A4 - - -    - - - -     C5 - - -    A4 - - -   |
  G4 - - -    - - - -     - - A4 -    C5 - - -   |
  D5 - - -    - - - -     C5 - A4 -   G4 - A4 -  |
  D4 - - -    - - - -     - - - -     . . . .    |`;

const DRONE = {
  d: hold('D2+A2', DRONE_STEPS),
  f: hold('F2+C3', DRONE_STEPS),
  g: hold('G2+D3', DRONE_STEPS),
  c: hold('C2+G2', DRONE_STEPS),
};

const PLUCK = {
  silent: rest(BAR_STEPS),
  low: 'D3 . . .  . . A3? .  . . . .  . . . .',
  fall: '. . . .  . . . .  D6? A5? G5? F5?  D5? C5? A4? G4?',
  climb: '. . . .  . . . .  A3? C4? D4? F4?  G4? A4? C5? D5?',
  fallLow: '. . . .  . . . .  F5? D5? C5? A4?  G4? F4? D4? C4?',
  climbHigh: '. . . .  . . . .  D4? F4? G4? A4?  C5? D5? F5? A5?',
};

const DRUMS = {
  gong: 'WG . . .  . . . .  . . . .  . . w w',
  beat: 'W . . .  . . . .  . . w .  . . . .',
  pulse: 'W . . .  . . w .  W . . .  . . w w',
  turn: 'W . . .  . . . .  t . t .  T . T T',
};

export const TITLE_SONG: Song = {
  bpm: 80,
  stepsPerBeat: 4,
  beatsPerBar: 4,
  loop: true,
  tracks: [
    { instrument: 'flute', velocity: 0.85, patterns: { tune: FLUTE }, order: ['tune'] },
    {
      instrument: 'pad',
      velocity: 0.9,
      patterns: DRONE,
      order: ['d', 'd', 'f', 'd', 'g', 'd', 'c', 'd'],
    },
    {
      instrument: 'pluck',
      velocity: 0.7,
      patterns: PLUCK,
      order: [
        ...['low', 'silent', 'silent', 'fall'],
        ...['low', 'silent', 'silent', 'climb'],
        ...['low', 'silent', 'silent', 'fallLow'],
        ...['low', 'silent', 'silent', 'climbHigh'],
      ],
    },
    {
      instrument: 'drums',
      velocity: 0.7,
      patterns: DRUMS,
      order: [
        ...['gong', 'beat', 'beat', 'beat'],
        ...['gong', 'beat', 'beat', 'pulse'],
        ...['gong', 'beat', 'pulse', 'beat'],
        ...['gong', 'beat', 'pulse', 'turn'],
      ],
    },
  ],
};

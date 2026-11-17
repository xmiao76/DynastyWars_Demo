/**
 * Stage-clear fanfare: "The Fleet Burns". Original composition.
 * 140 BPM, three bars (about 5 s), G gong (G A B D E). A horn call answered
 * an octave up by the flute, landing on a full chord with a plucked run, a
 * cymbal and the gong. Plays once.
 */
import type { Song } from '../sequencer';

const HORN = `
  D4 - D4 D4  G4 - - -    E4 - G4 -   A4 - - -   |
  B4 - A4 G4  A4 - B4 -   D5 - - -    E5 - D5 E5 |
  G4+B4+D5+G5 - - -  - - - -  - - - -  - - . .   |`;

const FLUTE = `
  D5 - D5 D5  G5 - - -    E5 - G5 -   A5 - - -   |
  B5 - A5 G5  A5 - B5 -   D6 - - -    E6 - D6 E6 |
  G6 - - -    - - - -     - - - -     - - . .    |`;

const PLUCK = `
  G3+D4 . . .  G3+D4 . . .  E3+B3 . . .  A3+E4 . . .      |
  G3+D4 . . .  D4+A4 . . .  D4+A4 . . .  D4+A4 . D4+A4 .  |
  G3 B3 D4 G4  B4 D5 G5 B5  D6 - - -     . . . .          |`;

const BASS = `
  G2 - - -    G2 - - -    E2 - - -    A2 - - -   |
  G2 - - -    D3 - - -    D2 - - -    D2 - D2 D2 |
  G2 - - -    - - - -     - - - -     - - . .    |`;

const DRUMS = `
  W . W W     WC . . .    W . W .     WC . . .    |
  W . W W     W . W .     T T T T     W! T! W! T! |
  WCG! . . .  . . . .     W . . .     . . . .     |`;

export const CLEAR_SONG: Song = {
  bpm: 140,
  stepsPerBeat: 4,
  beatsPerBar: 4,
  loop: false,
  tracks: [
    { instrument: 'horn', velocity: 0.9, patterns: { call: HORN }, order: ['call'] },
    { instrument: 'flute', velocity: 0.75, patterns: { call: FLUTE }, order: ['call'] },
    { instrument: 'pluck', velocity: 0.75, patterns: { strum: PLUCK }, order: ['strum'] },
    { instrument: 'bass', velocity: 0.8, patterns: { roots: BASS }, order: ['roots'] },
    { instrument: 'drums', velocity: 0.8, patterns: { march: DRUMS }, order: ['march'] },
  ],
};

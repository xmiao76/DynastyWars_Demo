/**
 * Game-over phrase: "Ashes on the Water". Original composition.
 * 60 BPM, one bar (4 s), E yu (E G A B D). A low flute sinks from B to the
 * tonic over a hollow fifth, a gong and a last falling pluck. Plays once.
 */
import { hold, type Song } from '../sequencer';

const BAR_STEPS = 16;

export const GAMEOVER_SONG: Song = {
  bpm: 60,
  stepsPerBeat: 4,
  beatsPerBar: 4,
  loop: false,
  tracks: [
    {
      instrument: 'flute',
      velocity: 0.9,
      patterns: { lament: 'B4 - - A4  G4 - E4 -  D4 - E4 -  - - - -' },
      order: ['lament'],
    },
    {
      instrument: 'pad',
      velocity: 0.8,
      patterns: { fifth: hold('E2+B2', BAR_STEPS) },
      order: ['fifth'],
    },
    {
      instrument: 'pluck',
      velocity: 0.7,
      patterns: { fall: '. . . .  . . . .  . . . .  E4? B3? G3? E3?' },
      order: ['fall'],
    },
    {
      instrument: 'drums',
      velocity: 0.7,
      patterns: { toll: 'G . . .  . . . .  . . . .  w . . .' },
      order: ['toll'],
    },
  ],
};

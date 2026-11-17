import type { SongId } from '../../data/audio-ids';
import type { Song } from '../sequencer';
import { BOSS_SONG } from './boss';
import { CLEAR_SONG } from './clear';
import { GAMEOVER_SONG } from './gameover';
import { STAGE_SONG } from './stage';
import { TITLE_SONG } from './title';

/** Every song the game can ask for; the Record type makes a missing id a compile error. */
export const SONGS: Record<SongId, Song> = {
  title: TITLE_SONG,
  stage: STAGE_SONG,
  boss: BOSS_SONG,
  clear: CLEAR_SONG,
  gameover: GAMEOVER_SONG,
};

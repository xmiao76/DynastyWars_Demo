/** Sound and music identifiers shared by the simulation (which emits them) and the audio engine. */
export const SFX_IDS = [
  'swing_light',
  'swing_heavy',
  'hit_light',
  'hit_heavy',
  'hit_slash',
  'hit_fire',
  'grab',
  'throw',
  'jump',
  'land',
  'body_fall',
  'dash',
  'special',
  'ko',
  'boss_ko',
  'player_hurt',
  'player_death',
  'arrow_shoot',
  'arrow_hit',
  'explode',
  'break',
  'mast_fall',
  'pickup_food',
  'pickup_gold',
  'go',
  'telegraph',
  'boss_roar',
  'war_horn',
  'ui_move',
  'ui_confirm',
  'pause',
  'continue_tick',
  'respawn',
  'tally',
] as const;

export type SfxId = (typeof SFX_IDS)[number];

export const SONG_IDS = ['title', 'stage', 'boss', 'clear', 'gameover'] as const;

export type SongId = (typeof SONG_IDS)[number];

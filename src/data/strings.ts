/**
 * All on-screen text. English comes first everywhere; Chinese is kept for
 * names, places and moves, always next to its English form.
 */
export const GAME_TITLE = {
  zh: '赤壁烽火',
  en: 'RED CLIFFS ABLAZE',
  tagline: 'A THREE KINGDOMS BRAWLER - DEMO',
  press: 'PRESS ENTER',
} as const;

/** How the demo was made, shown at the bottom of the title screen. Keep in step with the README. */
export const CREDITS: readonly (readonly [string, string])[] = [
  ['MODEL', 'CLAUDE FABLE 5.2'],
  ['PROVIDER', 'ANTHROPIC'],
  ['REASONING EFFORT', 'X-HIGH'],
  ['CODING AGENT', 'CLAUDE CODE'],
];

export const HERO_CARD = {
  zh: '关羽',
  en: 'GUAN YU',
  weaponZh: '青龙偃月刀',
  weaponEn: 'GREEN DRAGON CRESCENT BLADE',
  bio: ['GENERAL OF SHU, RENOWNED FOR', 'HIS LOYALTY AND LONG BEARD.'],
  stats: [
    ['POWER', 4],
    ['REACH', 5],
    ['SPEED', 3],
  ],
} as const;

export const SPECIAL_NAME = { zh: '青龙斩', en: 'DRAGON CLEAVE' } as const;

/** Key, then what it does. Shown on the select screen and the pause menu. */
export const CONTROLS: readonly (readonly [string, string])[] = [
  ['ARROWS/WASD', 'MOVE'],
  ['J', 'ATTACK - TAP FOR COMBO'],
  ['K', 'JUMP - J IN AIR TO SLASH'],
  ['→→', 'DASH - J TO SWEEP'],
  ['WALK INTO FOE', 'GRAB - J HIT, ←→+J THROW'],
  ['J+K', 'DRAGON CLEAVE (COSTS HP)'],
  ['P', 'PAUSE      M  MUTE'],
];

export const STAGE_CARD = {
  numberZh: '第一关',
  numberEn: 'STAGE 1',
  zh: '赤壁',
  en: 'RED CLIFFS',
  brief: ['WINTER, AD 208. THE CHAINED WEI', 'FLEET IS BURNING. BOARD IT AND', 'STRIKE DOWN ITS COMMANDER.'],
} as const;

export const BOSS_CARD = {
  zh: '于禁',
  en: 'YU JIN',
  title: 'COMMANDER OF THE WEI FLEET',
} as const;

export const CLEAR_TEXT = {
  zh: '过关',
  en: 'STAGE CLEAR',
  thanks: 'THANK YOU FOR PLAYING THE DEMO',
} as const;

export const GAME_OVER_TEXT = {
  en: 'GAME OVER',
  proverbZh: '胜败乃兵家常事',
  proverbEn: 'VICTORY AND DEFEAT ARE A SOLDIER\'S LOT',
} as const;

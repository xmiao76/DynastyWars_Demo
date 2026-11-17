/** Recipes for fighting sounds: swings, impacts, movement and voices. */
import { adsr, bp, hp, lp, noise, perc, swell, tone, type SfxRecipe } from './sfx-types';

const DEATH_FALL = adsr(0.01, 0.35, 0.55, 1.05, 0.3);

export const COMBAT_SFX = {
  swing_light: { level: 0.35, layers: [noise(bp(1100, 3800, 1.4), swell(0.04, 0.12), 1)] },
  swing_heavy: {
    level: 0.45,
    layers: [
      noise(bp(380, 1900, 1.2), swell(0.09, 0.24), 1),
      noise(lp(320), swell(0.06, 0.2), 0.5),
      tone('sine', 190, 85, swell(0.05, 0.22), 0.25),
    ],
  },
  hit_light: {
    level: 0.7,
    layers: [
      tone('sine', 200, 62, perc(0.14), 1),
      noise(bp(950), perc(0.07), 0.55),
      noise(hp(2600), perc(0.03), 0.4),
    ],
  },
  hit_heavy: {
    level: 0.9,
    layers: [
      tone('sine', 155, 36, perc(0.38), 1),
      tone('square', 96, 40, perc(0.16), 0.35, { filter: lp(700) }),
      noise(lp(1800, 280), perc(0.2), 0.7),
      noise(hp(2200), perc(0.03), 0.35),
    ],
  },
  hit_slash: {
    level: 0.75,
    layers: [
      noise(bp(5200, 2400, 1.6), perc(0.16), 0.9),
      tone('square', 2637, 2590, perc(0.12), 0.12),
      tone('square', 3951, 3900, perc(0.09), 0.08),
      tone('sine', 175, 58, perc(0.14), 0.8),
    ],
  },
  // A soft "whoomp" with a scatter of tiny high clicks for the crackle.
  hit_fire: {
    level: 0.7,
    layers: [
      tone('sine', 165, 55, perc(0.16), 0.8),
      noise(lp(2400, 420), swell(0.01, 0.38), 0.8),
      noise(hp(3200), perc(0.02), 0.5, 0.06),
      noise(hp(4200), perc(0.016), 0.45, 0.11),
      noise(hp(2800), perc(0.02), 0.4, 0.17),
      noise(hp(3800), perc(0.016), 0.35, 0.24),
      noise(hp(3000), perc(0.02), 0.25, 0.31),
    ],
  },
  grab: {
    level: 0.5,
    layers: [
      noise(lp(750), swell(0.006, 0.12), 0.9),
      noise(bp(1500, 1100, 1.2), swell(0.02, 0.07), 0.3),
      tone('sine', 125, 78, perc(0.1), 0.6),
    ],
  },
  throw: {
    level: 0.5,
    layers: [
      noise(bp(480, 3200, 1.3), swell(0.14, 0.2), 1),
      tone('triangle', 140, 330, swell(0.1, 0.2), 0.3),
    ],
  },
  jump: {
    level: 0.4,
    layers: [
      tone('triangle', 250, 640, swell(0.006, 0.15), 0.8),
      noise(bp(1200, 3000, 1.5), swell(0.02, 0.1), 0.3),
    ],
  },
  land: {
    level: 0.4,
    layers: [tone('sine', 135, 60, perc(0.12), 0.9), noise(lp(520), perc(0.07), 0.5)],
  },
  // Body on a wooden deck: a low thud, a board knock, then a smaller bounce.
  body_fall: {
    level: 0.75,
    layers: [
      tone('sine', 112, 40, perc(0.32), 1),
      noise(lp(950, 240), perc(0.2), 0.7),
      tone('triangle', 330, 200, perc(0.07), 0.4),
      tone('triangle', 260, 170, perc(0.07), 0.22, { at: 0.1 }),
      tone('sine', 95, 45, perc(0.14), 0.4, { at: 0.1 }),
    ],
  },
  dash: {
    level: 0.45,
    layers: [
      noise(bp(700, 4400, 2), swell(0.03, 0.24), 1),
      noise(hp(5000), swell(0.05, 0.16), 0.2),
    ],
  },
  // Rising spin, a shimmer of high partials, then the slash lands.
  special: {
    level: 0.85,
    layers: [
      noise(bp(400, 5200, 1.4), swell(0.32, 0.26), 0.8),
      tone('sawtooth', 180, 760, swell(0.28, 0.24), 0.4, { filter: lp(2600) }),
      tone('sine', 2093, 2140, swell(0.02, 0.3), 0.14, {
        at: 0.3,
        vibrato: { rate: 18, depth: 30 },
      }),
      tone('sine', 3136, 3200, swell(0.02, 0.26), 0.1, {
        at: 0.34,
        vibrato: { rate: 23, depth: 40 },
      }),
      tone('sine', 4186, 4250, swell(0.02, 0.22), 0.07, { at: 0.38 }),
      noise(hp(3800), perc(0.2), 0.7, 0.42),
      tone('sine', 130, 45, perc(0.2), 0.8, { at: 0.42 }),
    ],
  },
  ko: {
    level: 0.7,
    layers: [
      tone('sawtooth', 640, 170, swell(0.02, 0.42), 0.6, {
        filter: bp(1150, 700, 2.5),
        vibrato: { rate: 15, depth: 18 },
      }),
      tone('square', 320, 85, swell(0.02, 0.36), 0.18, { filter: lp(1400) }),
      tone('sine', 150, 48, perc(0.16), 0.9),
      noise(hp(2000), perc(0.03), 0.3),
    ],
  },
  boss_ko: {
    level: 0.95,
    layers: [
      noise(lp(3200, 110), swell(0.01, 1.45), 1),
      tone('sine', 92, 26, perc(1.2), 0.9),
      tone('sawtooth', 440, 52, swell(0.03, 1.35), 0.4, {
        filter: lp(1500, 300),
        vibrato: { rate: 11, depth: 14 },
      }),
      noise(lp(1500, 200), perc(0.4), 0.6, 0.38),
      noise(lp(1200, 160), perc(0.45), 0.5, 0.8),
      noise(hp(2500), perc(0.05), 0.4),
    ],
  },
  player_hurt: {
    level: 0.75,
    layers: [
      tone('square', 540, 250, swell(0.004, 0.22), 0.5, {
        filter: lp(3000),
        vibrato: { rate: 22, depth: 20 },
      }),
      tone('sine', 205, 75, perc(0.14), 0.8),
      noise(hp(2000), perc(0.04), 0.45),
    ],
  },
  player_death: {
    level: 0.75,
    layers: [
      tone('triangle', 660, 78, DEATH_FALL, 0.8, { vibrato: { rate: 7, depth: 9 } }),
      tone('square', 330, 39, DEATH_FALL, 0.2, { filter: lp(1200, 400) }),
      noise(lp(800), perc(0.14), 0.5),
      tone('sine', 150, 50, perc(0.18), 0.6),
    ],
  },
  // Growl: low sawtooths roughened by fast vibrato, with a breathy band of noise.
  boss_roar: {
    level: 0.85,
    layers: [
      tone('sawtooth', 96, 68, adsr(0.06, 0.2, 0.75, 0.68, 0.22), 0.8, {
        filter: lp(950, 480),
        vibrato: { rate: 27, depth: 9 },
      }),
      tone('sawtooth', 143, 99, adsr(0.08, 0.2, 0.7, 0.66, 0.2), 0.45, {
        filter: bp(820, 600, 2),
        vibrato: { rate: 31, depth: 12 },
      }),
      tone('sine', 52, 40, adsr(0.05, 0.2, 0.8, 0.68, 0.2), 0.6),
      noise(bp(520, 380), adsr(0.1, 0.2, 0.6, 0.62, 0.22), 0.35),
    ],
  },
} satisfies Record<string, SfxRecipe>;

/** Recipes for projectiles, the environment, pickups, cues and the menus. */
import { adsr, bp, held, hp, lp, noise, perc, swell, tone, type SfxRecipe } from './sfx-types';

const HORN_SWELL = adsr(0.14, 0.2, 0.85, 0.82, 0.2);
const GO_BEEP_1 = held(0.004, 0.1, 0.03);
const GO_BEEP_2 = held(0.004, 0.16, 0.05);
const GO_SECOND_AT = 0.17;
const RISE = adsr(0.05, 0.1, 0.8, 0.4, 0.12);
const CRASH_AT = 0.8;

export const WORLD_SFX = {
  // Bow string twang, then the arrow's whistle.
  arrow_shoot: {
    level: 0.5,
    layers: [
      tone('sawtooth', 250, 140, perc(0.13), 0.7, {
        filter: bp(900, 900, 4),
        vibrato: { rate: 34, depth: 12 },
      }),
      noise(bp(4600, 2500, 6), swell(0.02, 0.28), 0.6),
      tone('sine', 3300, 2100, swell(0.02, 0.24), 0.06),
    ],
  },
  arrow_hit: {
    level: 0.55,
    layers: [
      tone('triangle', 290, 130, perc(0.09), 0.8),
      tone('sine', 112, 66, perc(0.08), 0.5),
      noise(bp(1900, 1900, 2), perc(0.035), 0.5),
    ],
  },
  explode: {
    level: 0.95,
    layers: [
      tone('sine', 125, 28, perc(0.7), 1),
      tone('square', 72, 30, perc(0.4), 0.35, { filter: lp(320) }),
      noise(lp(5200, 180), swell(0.004, 0.85), 1),
      noise(hp(3000), perc(0.08), 0.5),
    ],
  },
  // Crack, three splintering knocks and a few high shards.
  break: {
    level: 0.7,
    layers: [
      noise(bp(2400, 1600), perc(0.16), 0.8),
      tone('triangle', 430, 250, perc(0.06), 0.5),
      tone('triangle', 320, 190, perc(0.06), 0.4, { at: 0.05 }),
      tone('triangle', 530, 320, perc(0.05), 0.3, { at: 0.11 }),
      tone('sine', 3300, 3250, perc(0.07), 0.1, { at: 0.03 }),
      tone('sine', 4400, 4330, perc(0.06), 0.08, { at: 0.08 }),
      tone('sine', 2800, 2760, perc(0.08), 0.08, { at: 0.14 }),
      tone('sine', 145, 55, perc(0.14), 0.6),
    ],
  },
  // Creak (a slow sawtooth through a narrow resonance, like stick-slip wood), then the crash.
  mast_fall: {
    level: 0.9,
    layers: [
      tone('sawtooth', 38, 23, adsr(0.1, 0.15, 0.8, 0.68, 0.1), 0.6, { filter: bp(680, 430, 7) }),
      tone('sawtooth', 57, 32, adsr(0.15, 0.15, 0.7, 0.6, 0.1), 0.35, {
        at: 0.08,
        filter: bp(1350, 900, 8),
      }),
      tone('sine', 102, 30, perc(0.7), 1, { at: CRASH_AT }),
      noise(lp(3600, 190), swell(0.004, 0.72), 0.9, CRASH_AT),
      noise(hp(2500), perc(0.06), 0.4, CRASH_AT),
      tone('triangle', 310, 170, perc(0.07), 0.4, { at: CRASH_AT }),
      tone('triangle', 240, 150, perc(0.07), 0.3, { at: 0.9 }),
    ],
  },
  pickup_food: {
    level: 0.45,
    steady: true,
    layers: [
      tone('sine', 1318.5, 1318.5, perc(0.16), 0.8),
      tone('triangle', 659.3, 659.3, perc(0.12), 0.25),
      tone('sine', 1760, 1760, perc(0.3), 0.8, { at: 0.09 }),
      tone('triangle', 880, 880, perc(0.22), 0.25, { at: 0.09 }),
    ],
  },
  pickup_gold: {
    level: 0.45,
    steady: true,
    layers: [
      tone('sine', 2349, 2349, perc(0.1), 0.7),
      tone('sine', 3136, 3136, perc(0.12), 0.7, { at: 0.045 }),
      tone('sine', 3951, 3951, perc(0.3), 0.7, { at: 0.09 }),
      tone('square', 1975.5, 1975.5, perc(0.2), 0.08, { at: 0.09 }),
      noise(hp(7000), perc(0.05), 0.15),
    ],
  },
  go: {
    level: 0.5,
    steady: true,
    layers: [
      tone('square', 988, 988, GO_BEEP_1, 0.5, { filter: lp(3200) }),
      tone('triangle', 988, 988, GO_BEEP_1, 0.6),
      tone('square', 988, 988, GO_BEEP_2, 0.5, { at: GO_SECOND_AT, filter: lp(3200) }),
      tone('triangle', 988, 988, GO_BEEP_2, 0.6, { at: GO_SECOND_AT }),
    ],
  },
  telegraph: {
    level: 0.5,
    layers: [
      tone('sine', 2400, 4900, swell(0.005, 0.26), 0.7),
      tone('sine', 3600, 7300, swell(0.005, 0.2), 0.25),
      noise(bp(6000, 9000, 5), swell(0.02, 0.22), 0.5),
    ],
  },
  war_horn: {
    level: 0.7,
    steady: true,
    layers: [
      tone('sawtooth', 110, 110, HORN_SWELL, 0.6, { filter: lp(360, 900) }),
      tone('sawtooth', 110.9, 110.9, HORN_SWELL, 0.5, { filter: lp(360, 900) }),
      tone('triangle', 55, 55, HORN_SWELL, 0.5),
      noise(bp(700), adsr(0.1, 0.2, 0.4, 0.8, 0.2), 0.06),
    ],
  },
  ui_move: {
    level: 0.25,
    steady: true,
    layers: [tone('square', 1175, 1175, perc(0.04), 0.6, { filter: lp(3000) })],
  },
  ui_confirm: {
    level: 0.4,
    steady: true,
    layers: [
      tone('triangle', 784, 784, perc(0.12), 0.8),
      tone('triangle', 1175, 1175, perc(0.3), 0.8, { at: 0.07 }),
      tone('sine', 2349, 2349, perc(0.2), 0.2, { at: 0.07 }),
    ],
  },
  pause: {
    level: 0.35,
    steady: true,
    layers: [
      tone('sine', 659.3, 659.3, swell(0.01, 0.16), 0.8),
      tone('sine', 493.9, 493.9, swell(0.01, 0.26), 0.8, { at: 0.1 }),
    ],
  },
  continue_tick: {
    level: 0.45,
    steady: true,
    layers: [tone('triangle', 988, 988, perc(0.13), 0.8), noise(bp(2000, 2000, 2), perc(0.02), 0.4)],
  },
  respawn: {
    level: 0.5,
    layers: [
      tone('triangle', 220, 1320, RISE, 0.7, { vibrato: { rate: 12, depth: 8 } }),
      tone('square', 440, 2640, RISE, 0.12, { filter: lp(4000) }),
      tone('sine', 2637, 2637, perc(0.25), 0.3, { at: 0.36 }),
    ],
  },
  tally: {
    level: 0.25,
    steady: true,
    layers: [tone('square', 1568, 1568, perc(0.05), 0.6, { filter: lp(4000) })],
  },
} satisfies Record<string, SfxRecipe>;

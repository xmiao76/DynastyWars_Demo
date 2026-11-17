import { describe, expect, test } from 'vitest';
import { approach, box, boxesOverlap, clamp, lerp, placeBox, sign } from '../../src/core/math';
import { rngNext, rngValue, seedFrom } from '../../src/core/rng';
import { SFX_IDS } from '../../src/data/audio-ids';
import { FIGHTERS } from '../../src/data/fighters';
import { allMoves, getMove, MOVES } from '../../src/data/moves';
import { FIRST_STAGE_ID, getStage, STAGES, zBandAt } from '../../src/data/stages';
import { SCREEN_W } from '../../src/data/tuning';
import { POSES } from '../../src/gfx/art/poses';
import { readPlayerIntent } from '../../src/sim/input';
import { BTN, type FighterKind } from '../../src/sim/types';
import { beginDraft } from '../../src/sim/world';
import { freshWorld } from '../support/world';

describe('rng', () => {
  test('the same state always yields the same value', () => {
    expect(rngValue(rngNext(42))).toBe(rngValue(rngNext(42)));
  });

  test('values stay in [0, 1) and vary', () => {
    let state = seedFrom(7);
    const values: number[] = [];
    for (let i = 0; i < 500; i++) {
      state = rngNext(state);
      values.push(rngValue(state));
    }
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
    expect(new Set(values).size).toBeGreaterThan(490);
  });

  test('a zero or fractional seed is normalised to a usable one', () => {
    expect(seedFrom(0)).toBe(1);
    expect(seedFrom(12.9)).toBe(12);
  });
});

describe('math helpers', () => {
  test('clamp, sign, lerp and approach behave at their edges', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-5, 0, 3)).toBe(0);
    expect(sign(-2)).toBe(-1);
    expect(sign(0)).toBe(0);
    expect(lerp(10, 20, 0.5)).toBe(15);
    expect(approach(0, 10, 3)).toBe(3);
    expect(approach(10, 0, 30)).toBe(0);
  });

  test('boxes overlap only when they share area', () => {
    expect(boxesOverlap(box(0, 10, 0, 10), box(5, 15, 5, 15))).toBe(true);
    expect(boxesOverlap(box(0, 10, 0, 10), box(11, 15, 0, 10))).toBe(false);
    expect(boxesOverlap(box(0, 10, 0, 10), box(0, 10, 11, 20))).toBe(false);
  });

  test('placing a box mirrors it for a left-facing fighter and lifts it by height', () => {
    expect(placeBox(box(4, 10, 0, 8), 100, 5, 1)).toEqual({ x0: 104, x1: 110, y0: 5, y1: 13 });
    expect(placeBox(box(4, 10, 0, 8), 100, 0, -1)).toEqual({ x0: 90, x1: 96, y0: 0, y1: 8 });
  });
});

describe('player input', () => {
  test('held directions become movement axes', () => {
    const draft = beginDraft(freshWorld());

    const intent = readPlayerIntent(draft, BTN.RIGHT | BTN.UP);

    expect(intent.mx).toBe(1);
    expect(intent.mz).toBe(-1);
    expect(intent.attack).toBe(false);
  });

  test('opposite directions cancel out', () => {
    const intent = readPlayerIntent(beginDraft(freshWorld()), BTN.LEFT | BTN.RIGHT);

    expect(intent.mx).toBe(0);
  });

  test('attack only registers on the press, not while held', () => {
    const draft = beginDraft(freshWorld());

    const first = readPlayerIntent(draft, BTN.ATTACK);
    draft.prevButtons = BTN.ATTACK;
    const held = readPlayerIntent(draft, BTN.ATTACK);

    expect(first.attack).toBe(true);
    expect(held.attack).toBe(false);
  });

  test('two quick taps of a direction request a dash; slow taps do not', () => {
    const draft = beginDraft(freshWorld());
    draft.tick = 10;
    readPlayerIntent(draft, BTN.RIGHT);
    draft.tick = 16;
    const quick = readPlayerIntent(draft, BTN.RIGHT);
    draft.tick = 100;
    readPlayerIntent(draft, BTN.RIGHT);
    draft.tick = 160;
    const slow = readPlayerIntent(draft, BTN.RIGHT);

    expect(quick.dash).toBe(true);
    expect(slow.dash).toBe(false);
  });

  test('attack and jump together are read as the special, not as either alone', () => {
    const intent = readPlayerIntent(beginDraft(freshWorld()), BTN.ATTACK | BTN.JUMP);

    expect(intent.special).toBe(true);
    expect(intent.attack).toBe(false);
    expect(intent.jump).toBe(false);
  });
});

describe('game data is consistent', () => {
  test('every move has frames with positive length and a valid chain target', () => {
    for (const move of allMoves()) {
      expect(move.frames.length, move.id).toBeGreaterThan(0);
      for (const frame of move.frames) expect(frame.ticks, move.id).toBeGreaterThan(0);
      if (move.chain) expect(MOVES[move.chain], `${move.id} -> ${move.chain}`).toBeDefined();
      for (const frame of move.frames) if (frame.sfx) expect(SFX_IDS).toContain(frame.sfx);
    }
  });

  test('looking up an unknown move or stage fails loudly', () => {
    expect(() => getMove('no_such_move')).toThrow(/Unknown move/);
    expect(() => getStage('no_such_stage')).toThrow(/Unknown stage/);
  });

  test('every move a fighter can use exists, and every pose it shows has been drawn', () => {
    for (const kind of Object.keys(FIGHTERS) as FighterKind[]) {
      const def = FIGHTERS[kind];
      const ids = [...Object.values(def.moves), def.ai?.attack, def.ai?.burst].filter((id): id is string => Boolean(id));
      for (const id of ids) {
        for (const frame of getMove(id).frames) expect(POSES[kind][frame.pose], `${kind} ${id} ${frame.pose}`).toBeDefined();
      }
    }
  });

  test('the boss moves all have drawn poses', () => {
    for (const move of allMoves().filter((m) => m.id.startsWith('yj_'))) {
      for (const frame of move.frames) expect(POSES.yujin[frame.pose], `${move.id} ${frame.pose}`).toBeDefined();
    }
  });

  test('every enemy attack has a readable wind-up before it can hit', () => {
    for (const kind of ['sword', 'spear', 'archer', 'brute'] as const) {
      const attack = getMove(FIGHTERS[kind].ai?.attack ?? '');
      expect(attack.frames[0].hit, kind).toBeUndefined();
      expect(attack.frames[0].ticks, kind).toBeGreaterThanOrEqual(16);
    }
  });

  test('stage sections are in order, fit the stage, and spawn in time order', () => {
    for (const stage of Object.values(STAGES)) {
      let previous = -1;
      for (const section of stage.sections) {
        expect(section.lockX, section.id).toBeGreaterThan(previous);
        expect(section.lockX + SCREEN_W, section.id).toBeLessThanOrEqual(stage.width);
        previous = section.lockX;
        for (const wave of section.waves) {
          const delays = wave.spawns.map((s) => s.delay);
          expect([...delays].sort((a, b) => a - b), section.id).toEqual(delays);
          for (const s of wave.spawns) expect(s.z >= stage.zMin && s.z <= stage.zMax, section.id).toBe(true);
        }
      }
      expect(stage.sections.filter((s) => s.boss)).toHaveLength(1);
      expect(stage.sections[stage.sections.length - 1].boss).toBe(true);
    }
  });

  test('walkable depth narrows on a gangplank and ramps in from the deck', () => {
    const stage = getStage(FIRST_STAGE_ID);
    const band = stage.bands[0];

    expect(zBandAt(stage, 300)).toEqual([stage.zMin, stage.zMax]);
    expect(zBandAt(stage, (band.x0 + band.x1) / 2)).toEqual([band.zMin, band.zMax]);
    const [rampMin, rampMax] = zBandAt(stage, band.x0 - stage.bandRamp / 2);
    expect(rampMin).toBeGreaterThan(stage.zMin);
    expect(rampMin).toBeLessThan(band.zMin);
    expect(rampMax).toBeLessThan(stage.zMax);
  });
});

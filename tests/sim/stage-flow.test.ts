import { describe, expect, test } from 'vitest';
import { FIGHTERS } from '../../src/data/fighters';
import { FIRST_STAGE_ID, getStage } from '../../src/data/stages';
import {
  CONTINUE_SECONDS,
  DOWN_TICKS,
  PLAYER_EDGE_MARGIN,
  RESPAWN_TICKS,
  SCREEN_W,
  START_LIVES,
  TICKS_PER_SECOND,
} from '../../src/data/tuning';
import { BTN, type World } from '../../src/sim/types';
import { botButtons } from '../e2e/bot';
import { fighterOf, freshWorld, hasEvent, patchPlayer, playerOf, run, runUntil, START_X, START_Z, withDummy, withHazard } from '../support/world';

const stage = getStage(FIRST_STAGE_ID);
const DEATH_FIRE = { kind: 'fire' as const, x: START_X, z: START_Z, halfW: 20, halfD: 8, delay: 0, ttl: -1, damage: 8 };

function dying(lives: number): World {
  const world = withHazard(patchPlayer(freshWorld(), { hp: 1 }), DEATH_FIRE);
  return { ...world, player: { ...world.player, lives } };
}

describe('stage progression', () => {
  test('reaching a section locks the screen and brings in its first wave', () => {
    // Arrange
    const world = freshWorld({ invincible: true });

    // Act
    const locked = runUntil(world, (w) => w.stage.active, 300, BTN.RIGHT);
    const arrived = runUntil(locked.world, (w) => w.fighters.length > 1, 60);

    // Assert
    expect(locked.world.stage.active).toBe(true);
    expect(locked.events.some((e) => e.t === 'section' && e.index === 0 && !e.boss)).toBe(true);
    expect(arrived.world.fighters.some((f) => f.team === 'enemy')).toBe(true);
  });

  test('the camera stays at the lock while the section is being fought', () => {
    const locked = runUntil(freshWorld({ invincible: true }), (w) => w.stage.active, 300, BTN.RIGHT);

    const after = run(locked.world, 200, BTN.RIGHT);

    expect(after.world.cameraX).toBeLessThanOrEqual(stage.sections[0].lockX);
    expect(playerOf(after.world).x).toBeLessThanOrEqual(after.world.cameraX + SCREEN_W - PLAYER_EDGE_MARGIN);
  });

  test('clearing every wave shows GO and unlocks the next section', () => {
    const world = freshWorld({ invincible: true });

    const after = runUntil(world, (w) => w.stage.section === 1, 3000, botButtons);

    expect(after.world.stage.section).toBe(1);
    expect(after.world.stage.active).toBe(false);
    expect(after.world.stage.goTicks).toBeGreaterThan(0);
    expect(hasEvent(after.events, 'go')).toBe(true);
  });

  test('the player cannot walk off the left edge of the screen', () => {
    const after = run(freshWorld(), 200, BTN.LEFT);

    expect(playerOf(after.world).x).toBe(after.world.cameraX + PLAYER_EDGE_MARGIN);
  });

  test('the camera only ever scrolls forward', () => {
    const forward = run(freshWorld({ invincible: true }), 60, BTN.RIGHT);

    const back = run(forward.world, 120, BTN.LEFT);

    expect(back.world.cameraX).toBeGreaterThanOrEqual(forward.world.cameraX);
  });
});

describe('after the boss falls', () => {
  function cleared(world: World): World {
    return { ...world, stage: { ...world.stage, cleared: true, active: false } };
  }

  test('a hero who fell with the boss is revived and still reaches the clear screen', () => {
    const fallen = patchPlayer(cleared(freshWorld()), { hp: 0, state: 'dead', stateTicks: 0 });

    const after = runUntil(fallen, (w) => w.phase === 'clear', 600);

    expect(after.world.phase).toBe('clear');
    expect(after.world.player.lives).toBe(START_LIVES);
    expect(playerOf(after.world).hp).toBeGreaterThan(0);
  });

  test('nothing can hurt the hero once the stage is won', () => {
    const world = withHazard(cleared(freshWorld()), DEATH_FIRE);

    const after = run(world, 30);

    expect(playerOf(after.world).hp).toBe(FIGHTERS.guanyu.maxHp);
  });

  test('a soldier already felled with the boss is not counted again when his thrown body lands', () => {
    const { world, id } = withDummy(cleared(freshWorld()), 'sword', START_X + 60, START_Z, { hp: 0, state: 'thrown', y: 20, vx: 2 });

    const after = runUntil(world, (w) => fighterOf(w, id).state === 'down', 120);

    expect(after.world.player.kos).toBe(0);
    expect(after.world.player.score).toBe(0);
  });
});

describe('lives and continues', () => {
  test('losing a life drops the hero back in with full health and brief invulnerability', () => {
    const world = dying(START_LIVES);

    const died = runUntil(world, (w) => w.player.lives < START_LIVES, 200);
    const back = runUntil(died.world, (w) => playerOf(w).hp > 0, RESPAWN_TICKS + 5);

    expect(hasEvent(died.events, 'playerDeath')).toBe(true);
    expect(back.world.player.lives).toBe(START_LIVES - 1);
    expect(playerOf(back.world).hp).toBe(FIGHTERS.guanyu.maxHp);
    expect(playerOf(back.world).invuln).toBeGreaterThan(0);
    expect(hasEvent(back.events, 'respawn')).toBe(true);
  });

  test('dropping back in knocks nearby enemies off their feet', () => {
    const { world, id } = withDummy(dying(START_LIVES), 'sword', START_X + 60);

    const back = runUntil(world, (w) => w.player.lives < START_LIVES && playerOf(w).hp > 0, DOWN_TICKS + RESPAWN_TICKS + 200);

    expect(fighterOf(back.world, id).state).toBe('launched');
  });

  test('losing the last life starts the continue countdown', () => {
    const after = runUntil(dying(1), (w) => w.phase === 'continue', 300);

    expect(after.world.phase).toBe('continue');
    expect(after.events.some((e) => e.t === 'continue' && e.seconds === CONTINUE_SECONDS)).toBe(true);
  });

  test('pressing START during the countdown continues with fresh lives', () => {
    const waiting = runUntil(dying(1), (w) => w.phase === 'continue', 300);

    const after = run(waiting.world, 2, (_w, i) => (i === 0 ? BTN.START : 0));

    expect(after.world.phase).toBe('play');
    expect(after.world.player.lives).toBe(START_LIVES);
    expect(after.world.player.continues).toBe(1);
    expect(playerOf(after.world).hp).toBe(FIGHTERS.guanyu.maxHp);
  });

  test('time spent on the continue screen does not count toward the run time', () => {
    const waiting = runUntil(dying(1), (w) => w.phase === 'continue', 300);

    const after = run(waiting.world, 120);

    expect(after.world.player.playTicks).toBe(waiting.world.player.playTicks);
    expect(waiting.world.player.playTicks).toBeGreaterThan(0);
  });

  test('letting the countdown run out ends the game', () => {
    const waiting = runUntil(dying(1), (w) => w.phase === 'continue', 300);

    const after = run(waiting.world, (CONTINUE_SECONDS + 1) * TICKS_PER_SECOND);

    expect(after.world.phase).toBe('gameover');
    expect(hasEvent(after.events, 'gameover')).toBe(true);
    expect(after.events.filter((e) => e.t === 'continue').map((e) => (e.t === 'continue' ? e.seconds : -1))).toContain(0);
  });

  test('nothing moves once the game is over', () => {
    const over = run(runUntil(dying(1), (w) => w.phase === 'continue', 300).world, (CONTINUE_SECONDS + 1) * TICKS_PER_SECOND);

    const after = run(over.world, 30, BTN.RIGHT | BTN.START);

    expect(after.world.phase).toBe('gameover');
    expect(playerOf(after.world).x).toBe(playerOf(over.world).x);
  });
});

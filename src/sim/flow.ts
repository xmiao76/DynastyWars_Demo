import { FIGHTERS } from '../data/fighters';
import {
  CLEAR_DELAY_TICKS,
  CONTINUE_SECONDS,
  KO_LAUNCH_VX,
  MIN_KO_LAUNCH_VY,
  RESPAWN_BLAST_RANGE,
  RESPAWN_DROP_HEIGHT,
  RESPAWN_INVULN,
  RESPAWN_TICKS,
  START_LIVES,
  TICKS_PER_SECOND,
} from '../data/tuning';
import { canBeHit } from './hit-detect';
import { launch } from './reactions';
import { BTN, type Draft, type FighterData } from './types';
import { emit, getPlayer, setState, sfx } from './world';

/** Returning to the fight knocks nearby enemies flat so the player is not mobbed on landing. */
function blastNearby(d: Draft, p: FighterData): void {
  for (const e of d.fighters) {
    if (e.team === p.team || Math.abs(e.x - p.x) > RESPAWN_BLAST_RANGE || !canBeHit(d, e)) continue;
    launch(d, e, e.x < p.x ? -KO_LAUNCH_VX : KO_LAUNCH_VX, MIN_KO_LAUNCH_VY);
  }
}

function respawn(d: Draft, p: FighterData): void {
  p.hp = FIGHTERS[p.kind].maxHp;
  p.y = RESPAWN_DROP_HEIGHT;
  p.vx = 0;
  p.vy = 0;
  p.vz = 0;
  p.link = 0;
  p.invuln = RESPAWN_INVULN;
  p.airAttacked = false;
  setState(p, 'air');
  blastNearby(d, p);
  emit(d, { t: 'respawn' });
  sfx(d, 'respawn');
}

function loseLife(d: Draft): void {
  d.player.lives -= 1;
  if (d.player.lives > 0) {
    d.player.respawn = RESPAWN_TICKS;
    return;
  }
  d.phase = 'continue';
  d.phaseTicks = 0;
  emit(d, { t: 'continue', seconds: CONTINUE_SECONDS });
}

/** The boss is down: wait a beat, then report the stage as cleared. */
function finishStage(d: Draft, p: FighterData): void {
  // A hero who fell in the same moment as the boss is stood back up at no cost, so the win is never lost.
  d.player.respawn = 0;
  if (p.hp <= 0 && p.state === 'dead') respawn(d, p);
  d.stage.clearTicks += 1;
  if (d.stage.clearTicks < CLEAR_DELAY_TICKS || p.hp <= 0) return;
  d.phase = 'clear';
  d.phaseTicks = 0;
  emit(d, { t: 'clear' });
}

/** Lives, respawns and the stage-clear delay while the fight is running. */
export function updateFlow(d: Draft): void {
  const p = getPlayer(d);
  if (!p) return;
  if (d.stage.cleared) {
    finishStage(d, p);
    return;
  }
  if (d.player.respawn > 0) {
    d.player.respawn -= 1;
    if (d.player.respawn === 0) respawn(d, p);
    return;
  }
  if (p.state === 'dead') loseLife(d);
}

/** The continue countdown: START buys back in, otherwise the game ends. */
export function stepContinue(d: Draft, buttons: number): void {
  const p = getPlayer(d);
  const pressedStart = (buttons & ~d.prevButtons & BTN.START) !== 0;
  if (pressedStart && p) {
    d.player.lives = START_LIVES;
    d.player.continues += 1;
    d.phase = 'play';
    d.phaseTicks = 0;
    respawn(d, p);
    return;
  }
  d.phaseTicks += 1;
  if (d.phaseTicks % TICKS_PER_SECOND !== 0) return;
  const remaining = CONTINUE_SECONDS - d.phaseTicks / TICKS_PER_SECOND;
  if (remaining < 0) {
    d.phase = 'gameover';
    d.phaseTicks = 0;
    emit(d, { t: 'gameover' });
    return;
  }
  emit(d, { t: 'continue', seconds: remaining });
  sfx(d, 'continue_tick');
}

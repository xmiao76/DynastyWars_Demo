import { getMove } from '../data/moves';
import { COMBO_BUFFER } from '../data/tuning';
import { grabHit, throwVictim } from './grab';
import { spawnArrow } from './spawn';
import { startLeap, summonReinforcements } from './summon';
import {
  F_CANCEL,
  F_HOLD_AIR,
  F_REHIT,
  type Draft,
  type Fighter,
  type FighterData,
  type FrameEffect,
  type Intent,
  type MoveFrame,
  type MoveId,
} from './types';
import { emit, findFighter, fx, isAirborne, setState, sfx } from './world';

const LANDING_SHAKE = 5;

/** The move frame a fighter is currently showing, if it is attacking. */
export function currentFrame(f: Fighter | FighterData): MoveFrame | null {
  if (f.state !== 'attack' || f.moveId === null) return null;
  return getMove(f.moveId).frames[f.frame] ?? null;
}

export function frameFlags(f: Fighter | FighterData): number {
  return currentFrame(f)?.flags ?? 0;
}

function applyEffect(d: Draft, f: FighterData, effect: FrameEffect): void {
  switch (effect) {
    case 'arrow':
      spawnArrow(d, f);
      return;
    case 'leap':
      startLeap(d, f);
      return;
    case 'summon':
      summonReinforcements(d, f);
      return;
    case 'grabHit':
      grabHit(d, f);
      return;
    case 'throw':
      throwVictim(d, f);
      return;
    case 'shake':
      emit(d, { t: 'shake', power: LANDING_SHAKE });
      fx(d, 'dust', f.x, 0, f.z, true);
      return;
  }
}

function enterFrame(d: Draft, f: FighterData, frame: MoveFrame): void {
  if (frame.sfx) sfx(d, frame.sfx);
  if ((frame.flags ?? 0) & F_REHIT) f.hitIds = [];
  if (frame.effect) applyEffect(d, f, frame.effect);
}

export function startMove(d: Draft, f: FighterData, moveId: MoveId): void {
  const move = getMove(moveId);
  f.state = 'attack';
  f.stateTicks = 0;
  f.moveId = moveId;
  f.frame = 0;
  f.frameTick = 0;
  f.hitIds = [];
  f.moveHit = false;
  f.buffer = 0;
  if (!move.air) {
    f.vx = 0;
    f.vz = 0;
  }
  enterFrame(d, f, move.frames[0]);
}

function endMove(d: Draft, f: FighterData): void {
  const partner = f.link ? findFighter(d, f.link) : undefined;
  if (partner && partner.state === 'grabbed') {
    setState(f, 'grabbing');
    return;
  }
  f.link = 0;
  setState(f, isAirborne(f) ? 'air' : 'idle');
}

/** Advance the current move by one tick: travel, chain cancels, frame changes. */
export function advanceMove(d: Draft, f: FighterData, intent: Intent): void {
  if (f.moveId === null) {
    setState(f, 'idle');
    return;
  }
  const move = getMove(f.moveId);
  const frame = move.frames[f.frame];
  const flags = frame.flags ?? 0;
  if (intent.attack) f.buffer = COMBO_BUFFER;
  if (frame.dx) f.x += (f.facing * frame.dx) / frame.ticks;
  if (flags & F_CANCEL && f.buffer > 0 && f.moveHit && move.chain) {
    startMove(d, f, move.chain);
    return;
  }
  const done = flags & F_HOLD_AIR ? !isAirborne(f) && f.frameTick > 0 : f.frameTick + 1 >= frame.ticks;
  f.frameTick += 1;
  if (!done) return;
  f.frame += 1;
  f.frameTick = 0;
  const next = move.frames[f.frame];
  if (next) enterFrame(d, f, next);
  else endMove(d, f);
}

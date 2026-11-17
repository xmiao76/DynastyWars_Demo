import { getStage } from '../data/stages';
import { COMBO_BUFFER, DEAD_TICKS } from '../data/tuning';
import { think } from './ai/brain';
import { updateDirector } from './ai/director';
import { updateFighter } from './fighter-fsm';
import { updateFlow, stepContinue } from './flow';
import { tryGrab } from './grab';
import { updateHazards, updateProjectiles } from './hazards';
import { applyHit } from './hit-apply';
import { collectFighterHits } from './hit-detect';
import { readPlayerIntent } from './input';
import { integrate, updateCamera } from './physics';
import { updatePickups } from './pickups';
import { updateStage } from './stage-director';
import type { Draft, FighterData, Intent, StepResult, World } from './types';
import { beginDraft, finishDraft } from './world';

/** Frozen by hitstop: nothing moves, but an attack press is still remembered. */
function holdFrozen(f: FighterData, isPlayer: boolean, intent: Intent): void {
  f.hitstop -= 1;
  if (isPlayer && intent.attack && f.state === 'attack') f.buffer = COMBO_BUFFER;
}

function updateFighters(d: Draft, playerIntent: Intent): void {
  const stage = getStage(d.stageId);
  for (const f of d.fighters) {
    const isPlayer = f.id === d.player.id;
    if (f.flash > 0) f.flash -= 1;
    if (f.hitstop > 0) {
      holdFrozen(f, isPlayer, playerIntent);
      continue;
    }
    updateFighter(d, f, isPlayer ? playerIntent : think(d, f));
    integrate(d, f, stage);
  }
}

function resolveHits(d: Draft): void {
  const hits = [...collectFighterHits(d), ...updateProjectiles(d), ...updateHazards(d)];
  for (const hit of hits) applyHit(d, hit);
}

/** Remove defeated enemies once they have finished blinking out, and broken props. */
function sweep(d: Draft): void {
  d.fighters = d.fighters.filter((f) => !(f.team === 'enemy' && f.state === 'dead' && f.stateTicks >= DEAD_TICKS));
  for (const prop of d.props) if (prop.flash > 0) prop.flash -= 1;
  d.props = d.props.filter((prop) => prop.hp > 0);
}

function stepPlay(d: Draft, buttons: number): void {
  const stage = getStage(d.stageId);
  const playerIntent = readPlayerIntent(d, buttons);
  d.player.playTicks += 1;
  updateDirector(d);
  updateFighters(d, playerIntent);
  tryGrab(d);
  resolveHits(d);
  updatePickups(d);
  updateCamera(d, stage);
  updateStage(d, stage);
  updateFlow(d);
  sweep(d);
}

/**
 * Advance the game by one tick. Pure from the outside: the given world is never
 * modified, and the same world and buttons always produce the same result.
 */
export function step(world: World, buttons: number): StepResult {
  const d = beginDraft(world);
  d.tick += 1;
  if (d.phase === 'play') stepPlay(d, buttons);
  else if (d.phase === 'continue') stepContinue(d, buttons);
  else d.phaseTicks += 1;
  d.prevButtons = buttons;
  return finishDraft(d);
}

import { FIRST_STAGE_ID } from '../../src/data/stages';
import { step } from '../../src/sim/step';
import type { Cheats, Fighter, FighterData, FighterKind, HazardData, SimEvent, World } from '../../src/sim/types';
import { buildFighter, createWorld } from '../../src/sim/world';

/** Where the hero starts on the first stage. */
export const START_X = 70;
export const START_Z = 184;

export function freshWorld(cheats: Partial<Cheats> = {}): World {
  return createWorld(FIRST_STAGE_ID, 1, cheats);
}

function addFighter(world: World, fighter: FighterData): { world: World; id: number } {
  return { world: { ...world, nextId: fighter.id + 1, fighters: [...world.fighters, fighter] }, id: fighter.id };
}

/** Add an enemy with no AI: it stands still and only reacts to being hit. */
export function withDummy(
  world: World,
  kind: FighterKind,
  x: number,
  z: number = START_Z,
  patch: Partial<FighterData> = {},
): { world: World; id: number } {
  return addFighter(world, { ...buildFighter(world.nextId, kind, x, z, -1), ai: null, ...patch });
}

/** Add an enemy with its normal AI, already counted as on screen. */
export function withEnemy(world: World, kind: FighterKind, x: number, z: number = START_Z): { world: World; id: number } {
  const fighter = buildFighter(world.nextId, kind, x, z, -1);
  if (fighter.ai) fighter.ai.entered = true;
  return addFighter(world, fighter);
}

export function patchFighter(world: World, id: number, patch: Partial<FighterData>): World {
  return { ...world, fighters: world.fighters.map((f) => (f.id === id ? { ...f, ...patch } : f)) } as World;
}

export function patchPlayer(world: World, patch: Partial<FighterData>): World {
  return patchFighter(world, world.player.id, patch);
}

export function withHazard(world: World, hazard: Omit<HazardData, 'id'>): World {
  return { ...world, nextId: world.nextId + 1, hazards: [...world.hazards, { id: world.nextId, ...hazard }] };
}

export function fighterOf(world: World, id: number): Fighter {
  const fighter = world.fighters.find((f) => f.id === id);
  if (!fighter) throw new Error(`No fighter ${id} in the world`);
  return fighter;
}

export function findFighter(world: World, id: number): Fighter | undefined {
  return world.fighters.find((f) => f.id === id);
}

export function playerOf(world: World): Fighter {
  return fighterOf(world, world.player.id);
}

export type ButtonSource = number | ((world: World, index: number) => number);

export interface Run {
  readonly world: World;
  readonly events: readonly SimEvent[];
  /** Every world along the way, oldest first. */
  readonly history: readonly World[];
}

/** Step the world a fixed number of ticks, collecting every event. */
export function run(start: World, ticks: number, buttons: ButtonSource = 0): Run {
  let world = start;
  const events: SimEvent[] = [];
  const history: World[] = [];
  for (let i = 0; i < ticks; i++) {
    const result = step(world, typeof buttons === 'function' ? buttons(world, i) : buttons);
    world = result.world;
    events.push(...result.events);
    history.push(world);
  }
  return { world, events, history };
}

/** Step until the predicate holds or the budget runs out. */
export function runUntil(start: World, done: (world: World) => boolean, maxTicks: number, buttons: ButtonSource = 0): Run {
  let world = start;
  const events: SimEvent[] = [];
  const history: World[] = [];
  for (let i = 0; i < maxTicks && !done(world); i++) {
    const result = step(world, typeof buttons === 'function' ? buttons(world, i) : buttons);
    world = result.world;
    events.push(...result.events);
    history.push(world);
  }
  return { world, events, history };
}

/** Hold a button for one tick, then release it for one tick. */
export function tap(start: World, button: number): Run {
  const pressed = run(start, 1, button);
  const released = run(pressed.world, 1, 0);
  return { world: released.world, events: [...pressed.events, ...released.events], history: [...pressed.history, ...released.history] };
}

/** A button source that presses and releases on a steady rhythm, as a player mashing would. */
export function mashing(button: number, period = 6): ButtonSource {
  return (_world, index) => (index % period < period / 2 ? button : 0);
}

export function hasEvent(events: readonly SimEvent[], type: SimEvent['t']): boolean {
  return events.some((e) => e.t === type);
}

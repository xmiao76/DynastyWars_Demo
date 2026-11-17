import { rngNext, rngValue, seedFrom } from '../core/rng';
import type { SfxId } from '../data/audio-ids';
import { FIGHTERS } from '../data/fighters';
import { getStage } from '../data/stages';
import type { HazardSpawn } from '../data/stages/types';
import { START_LIVES, STRIKE_LINGER_TICKS, FIRE_DAMAGE, MAST_DAMAGE, RAIN_DAMAGE } from '../data/tuning';
import type {
  AiData,
  Cheats,
  Draft,
  Facing,
  Fighter,
  FighterData,
  FighterKind,
  FighterState,
  FxKind,
  HazardData,
  SimEvent,
  StepResult,
  World,
} from './types';

const NEVER = -1000;
const PROP_HP = 2;
const HAZARD_DAMAGE = { fire: FIRE_DAMAGE, mast: MAST_DAMAGE, rain: RAIN_DAMAGE } as const;

export function defaultAi(side: Facing): AiData {
  return {
    mode: 'hold',
    side,
    zOff: 0,
    dist: 70,
    token: false,
    tokenTicks: 0,
    cool: 30,
    think: 0,
    entered: false,
    phase: 1,
    flinches: 0,
    flinchTimer: 0,
    lastMove: null,
    repeats: 0,
    plan: null,
    planTicks: 0,
  };
}

export function buildFighter(id: number, kind: FighterKind, x: number, z: number, facing: Facing): FighterData {
  const def = FIGHTERS[kind];
  return {
    id,
    kind,
    team: def.team,
    x,
    y: 0,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    facing,
    hp: def.maxHp,
    state: 'idle',
    stateTicks: 0,
    moveId: null,
    frame: 0,
    frameTick: 0,
    hitIds: [],
    moveHit: false,
    buffer: 0,
    hitstop: 0,
    invuln: 0,
    stun: 0,
    link: 0,
    grabHits: 0,
    airAttacked: false,
    bounced: false,
    flash: 0,
    ai: def.ai ? defaultAi(facing === 1 ? -1 : 1) : null,
  };
}

export function buildHazard(id: number, spawn: HazardSpawn): HazardData {
  return {
    id,
    kind: spawn.kind,
    x: spawn.x,
    z: spawn.z,
    halfW: spawn.halfW,
    halfD: spawn.halfD,
    delay: spawn.delay,
    ttl: spawn.kind === 'fire' ? -1 : STRIKE_LINGER_TICKS,
    damage: HAZARD_DAMAGE[spawn.kind],
  };
}

/** Build the starting world for a stage. Same stage and seed always give the same world. */
export function createWorld(stageId: string, seed: number, cheats: Partial<Cheats> = {}): World {
  const stage = getStage(stageId);
  let nextId = 1;
  const player = buildFighter(nextId++, 'guanyu', stage.startX, stage.startZ, 1);
  const props = stage.props.map((p) => ({ id: nextId++, kind: p.kind, x: p.x, z: p.z, hp: PROP_HP, drop: p.drop, flash: 0 }));
  const hazards = stage.hazards.map((h) => buildHazard(nextId++, h));
  return {
    tick: 0,
    rng: seedFrom(seed),
    prevButtons: 0,
    phase: 'play',
    phaseTicks: 0,
    stageId,
    cameraX: 0,
    nextId,
    fighters: [player],
    props,
    pickups: [],
    projectiles: [],
    hazards,
    stage: { section: 0, active: false, wave: 0, waveTicks: 0, spawned: 0, gap: 0, cleared: false, goTicks: 0, clearTicks: 0 },
    director: { cooldown: 60, rebalance: 0 },
    input: { tapDir: 0, tapTick: NEVER, attackTick: NEVER, jumpTick: NEVER },
    player: { id: player.id, lives: START_LIVES, score: 0, continues: 0, respawn: 0, kos: 0, playTicks: 0 },
    cheats: { invincible: cheats.invincible ?? false },
  };
}

function cloneFighter(f: Fighter): FighterData {
  return { ...f, hitIds: [...f.hitIds], ai: f.ai ? { ...f.ai } : null };
}

/** Copy the immutable world into a working draft for one tick. */
export function beginDraft(world: World): Draft {
  return {
    ...world,
    fighters: world.fighters.map(cloneFighter),
    props: world.props.map((p) => ({ ...p })),
    pickups: world.pickups.map((p) => ({ ...p })),
    projectiles: world.projectiles.map((p) => ({ ...p })),
    hazards: world.hazards.map((h) => ({ ...h })),
    stage: { ...world.stage },
    director: { ...world.director },
    input: { ...world.input },
    player: { ...world.player },
    cheats: { ...world.cheats },
    events: [],
  };
}

export function finishDraft(d: Draft): StepResult {
  const { events, ...world } = d;
  return { world, events };
}

// ------------------------------------------------------------ draft helpers

export function rand(d: Draft): number {
  d.rng = rngNext(d.rng);
  return rngValue(d.rng);
}

export function randRange(d: Draft, min: number, max: number): number {
  return min + rand(d) * (max - min);
}

export function emit(d: Draft, event: SimEvent): void {
  d.events.push(event);
}

export function sfx(d: Draft, id: SfxId): void {
  d.events.push({ t: 'sfx', id });
}

export function fx(d: Draft, kind: FxKind, x: number, y: number, z: number, heavy = false): void {
  d.events.push({ t: 'fx', kind, x, y, z, heavy });
}

export function allocId(d: Draft): number {
  return d.nextId++;
}

export function findFighter(d: Draft, id: number): FighterData | undefined {
  return d.fighters.find((f) => f.id === id);
}

export function getPlayer(d: Draft): FighterData | undefined {
  return findFighter(d, d.player.id);
}

export function isAirborne(f: Pick<FighterData, 'y' | 'vy'>): boolean {
  return f.y > 0 || f.vy > 0;
}

export function setState(f: FighterData, state: FighterState): void {
  f.state = state;
  f.stateTicks = 0;
  if (state !== 'attack') {
    f.moveId = null;
    f.frame = 0;
    f.frameTick = 0;
  }
}

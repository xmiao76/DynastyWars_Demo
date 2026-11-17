import type { Box } from '../core/math';
import type { SfxId } from '../data/audio-ids';

/** Button bitmask fed to the simulation each tick. */
export const BTN = {
  LEFT: 1,
  RIGHT: 2,
  UP: 4,
  DOWN: 8,
  ATTACK: 16,
  JUMP: 32,
  START: 64,
} as const;

export type Team = 'player' | 'enemy';
export type FighterKind = 'guanyu' | 'sword' | 'spear' | 'archer' | 'brute' | 'yujin';
export type FighterState =
  | 'idle'
  | 'walk'
  | 'dash'
  | 'air'
  | 'attack'
  | 'hurt'
  | 'launched'
  | 'down'
  | 'getup'
  | 'grabbing'
  | 'grabbed'
  | 'thrown'
  | 'dead';

export type MoveId = string;
export type PoseId = string;
export type Facing = 1 | -1;
export type Axis = -1 | 0 | 1;

/** What a fighter wants to do this tick. Players get it from buttons, enemies from their AI. */
export interface Intent {
  readonly mx: Axis;
  readonly mz: Axis;
  readonly attack: boolean;
  readonly jump: boolean;
  readonly special: boolean;
  readonly dash: boolean;
  /** AI only: start this specific move. */
  readonly move?: MoveId;
  /** AI only: face this way while standing or strafing. */
  readonly face?: Facing;
}

export const NO_INTENT: Intent = {
  mx: 0,
  mz: 0,
  attack: false,
  jump: false,
  special: false,
  dash: false,
};

// ---------------------------------------------------------------- frame data

export const F_INVULN = 1;
export const F_ARMOR = 2;
export const F_CANCEL = 4;
export const F_HOLD_AIR = 8;
export const F_REHIT = 16;

export type HitReaction = 'flinch' | 'knockdown';
export type SparkKind = 'slash' | 'blunt' | 'fire';
export type FrameEffect = 'arrow' | 'leap' | 'summon' | 'grabHit' | 'throw' | 'shake';

export interface HitDef {
  readonly box: Box;
  readonly zRange: number;
  readonly damage: number;
  readonly hitstop: number;
  readonly stun: number;
  readonly kbx: number;
  readonly kby: number;
  readonly react: HitReaction;
  readonly spark: SparkKind;
  readonly heavy: boolean;
  /** Knock victims away from the attacker's centre instead of along its facing. */
  readonly radial: boolean;
}

export interface MoveFrame {
  readonly ticks: number;
  readonly pose: PoseId;
  readonly hit?: HitDef;
  /** Total forward travel over this frame, spread evenly across its ticks. */
  readonly dx?: number;
  readonly flags?: number;
  readonly sfx?: SfxId;
  readonly effect?: FrameEffect;
}

export interface MoveDef {
  readonly id: MoveId;
  readonly frames: readonly MoveFrame[];
  /** Next move if attack is buffered during a cancel window after this one connected. */
  readonly chain?: MoveId;
  /** HP paid by the attacker the first time this move connects. */
  readonly hpCost?: number;
  /** Started in the air; keeps horizontal momentum. */
  readonly air?: boolean;
}

// ------------------------------------------------------------------ entities

export type AiMode = 'hold' | 'engage';

export interface AiData {
  mode: AiMode;
  /** Which side of the player this enemy prefers to stand on. */
  side: Facing;
  zOff: number;
  dist: number;
  token: boolean;
  tokenTicks: number;
  cool: number;
  think: number;
  entered: boolean;
  // Boss bookkeeping
  phase: number;
  flinches: number;
  flinchTimer: number;
  lastMove: MoveId | null;
  repeats: number;
  plan: MoveId | null;
  planTicks: number;
}

export interface FighterData {
  id: number;
  kind: FighterKind;
  team: Team;
  x: number;
  /** Height above the ground. */
  y: number;
  /** Depth on the belt; also the screen y of the feet. */
  z: number;
  vx: number;
  vy: number;
  vz: number;
  facing: Facing;
  hp: number;
  state: FighterState;
  stateTicks: number;
  moveId: MoveId | null;
  frame: number;
  frameTick: number;
  hitIds: number[];
  moveHit: boolean;
  buffer: number;
  hitstop: number;
  invuln: number;
  stun: number;
  /** Grab partner id, or 0. */
  link: number;
  grabHits: number;
  airAttacked: boolean;
  bounced: boolean;
  flash: number;
  ai: AiData | null;
}

export type PropKind = 'crate' | 'jar' | 'barrel';
export type PickupKind = 'bun' | 'chicken' | 'gold';

export interface PropData {
  id: number;
  kind: PropKind;
  x: number;
  z: number;
  hp: number;
  drop: PickupKind | null;
  flash: number;
}

export interface PickupData {
  id: number;
  kind: PickupKind;
  x: number;
  y: number;
  z: number;
  vy: number;
  ttl: number;
}

export interface ProjectileData {
  id: number;
  team: Team;
  x: number;
  y: number;
  z: number;
  vx: number;
  damage: number;
  ttl: number;
}

export type HazardKind = 'fire' | 'mast' | 'rain';

export interface HazardData {
  id: number;
  kind: HazardKind;
  x: number;
  z: number;
  /** Half extents of the danger zone. */
  halfW: number;
  halfD: number;
  /** Ticks until a one-shot strike lands; 0 for persistent fire. */
  delay: number;
  /** Remaining lifetime after the strike has landed; -1 for permanent. */
  ttl: number;
  damage: number;
}

// --------------------------------------------------------------------- world

export type Phase = 'play' | 'continue' | 'gameover' | 'clear';

export interface StageProgress {
  /** Index of the section being fought or approached. */
  section: number;
  /** True while the current section is scroll-locked. */
  active: boolean;
  wave: number;
  waveTicks: number;
  /** How many spawns of the current wave have been released. */
  spawned: number;
  /** Ticks spent between waves. */
  gap: number;
  cleared: boolean;
  goTicks: number;
  clearTicks: number;
}

export interface DirectorState {
  cooldown: number;
  rebalance: number;
}

export interface InputState {
  tapDir: Axis;
  tapTick: number;
  attackTick: number;
  jumpTick: number;
}

export interface PlayerState {
  id: number;
  lives: number;
  score: number;
  continues: number;
  respawn: number;
  kos: number;
  /** Ticks actually spent fighting; excludes the continue screen. */
  playTicks: number;
}

export interface Cheats {
  invincible: boolean;
}

export interface WorldData {
  tick: number;
  rng: number;
  prevButtons: number;
  phase: Phase;
  phaseTicks: number;
  stageId: string;
  cameraX: number;
  nextId: number;
  fighters: FighterData[];
  props: PropData[];
  pickups: PickupData[];
  projectiles: ProjectileData[];
  hazards: HazardData[];
  stage: StageProgress;
  director: DirectorState;
  input: InputState;
  player: PlayerState;
  cheats: Cheats;
}

export type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

/** The world as everything outside `step` sees it: an immutable snapshot. */
export type World = DeepReadonly<WorldData>;
export type Fighter = DeepReadonly<FighterData>;
export type Prop = DeepReadonly<PropData>;
export type Pickup = DeepReadonly<PickupData>;
export type Projectile = DeepReadonly<ProjectileData>;
export type Hazard = DeepReadonly<HazardData>;

// -------------------------------------------------------------------- events

export type FxKind =
  | 'spark_slash'
  | 'spark_blunt'
  | 'spark_fire'
  | 'dust'
  | 'explode'
  | 'break'
  | 'pickup'
  | 'ko'
  | 'summon'
  | 'special';

export type SimEvent =
  | { readonly t: 'fx'; readonly kind: FxKind; readonly x: number; readonly y: number; readonly z: number; readonly heavy: boolean }
  | { readonly t: 'sfx'; readonly id: SfxId }
  | { readonly t: 'shake'; readonly power: number }
  | { readonly t: 'enemyHit'; readonly id: number }
  | { readonly t: 'score'; readonly amount: number; readonly x: number; readonly z: number }
  | { readonly t: 'section'; readonly index: number; readonly boss: boolean }
  | { readonly t: 'go' }
  | { readonly t: 'bossPhase'; readonly phase: number }
  | { readonly t: 'bossDown' }
  | { readonly t: 'playerDeath' }
  | { readonly t: 'respawn' }
  | { readonly t: 'continue'; readonly seconds: number }
  | { readonly t: 'gameover' }
  | { readonly t: 'clear' };

export interface StepResult {
  readonly world: World;
  readonly events: readonly SimEvent[];
}

/** Tick-local mutable working copy. Only `step` and its helpers ever see one. */
export interface Draft extends WorldData {
  events: SimEvent[];
}

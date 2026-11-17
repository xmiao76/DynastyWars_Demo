import { FIGHTERS, type FighterDef } from '../data/fighters';
import {
  AIR_CONTROL,
  BOSS_WAKE_INVULN,
  DASH_MAX_TICKS,
  DASH_MIN_TICKS,
  DOWN_TICKS,
  GETUP_TICKS,
  GRAB_HOLD_TICKS,
  HURT_FRICTION,
  SPECIAL_WINDOW,
  WAKE_INVULN_ENEMY,
  WAKE_INVULN_PLAYER,
} from '../data/tuning';
import { advanceMove, startMove } from './fighter-moves';
import { holdInPlace, releaseGrab } from './grab';
import type { Draft, FighterData, FighterState, Intent, MoveId } from './types';
import { findFighter, fx, setState, sfx } from './world';

type Handler = (d: Draft, f: FighterData, intent: Intent) => void;

const DASH_Z_FACTOR = 0.6;
const FORWARD_JUMP_SPEED = 0.3;
const SPECIAL_MAX_HEIGHT = 20;

function startJump(d: Draft, f: FighterData, def: FighterDef, vx: number): void {
  f.vy = def.jumpV;
  f.vx = vx;
  f.vz = 0;
  f.airAttacked = false;
  setState(f, 'air');
  sfx(d, 'jump');
}

function startSpecial(d: Draft, f: FighterData, moveId: MoveId): void {
  f.y = 0;
  f.vy = 0;
  startMove(d, f, moveId);
  fx(d, 'special', f.x, 0, f.z, true);
}

function walk(f: FighterData, intent: Intent, def: FighterDef): void {
  f.vx = intent.mx * def.speed;
  f.vz = intent.mz * def.speedZ;
  if (intent.mx !== 0) f.facing = intent.mx;
  if (intent.face) f.facing = intent.face;
  const next: FighterState = intent.mx !== 0 || intent.mz !== 0 ? 'walk' : 'idle';
  if (f.state !== next) setState(f, next);
}

const ground: Handler = (d, f, intent) => {
  const def = FIGHTERS[f.kind];
  if (intent.move) {
    if (intent.face) f.facing = intent.face;
    startMove(d, f, intent.move);
    return;
  }
  if (intent.special && def.moves.special) {
    startSpecial(d, f, def.moves.special);
    return;
  }
  if (intent.jump && def.jumpV > 0) {
    startJump(d, f, def, intent.mx * def.speed * AIR_CONTROL);
    return;
  }
  if ((intent.attack || f.buffer > 0) && def.moves.combo) {
    if (intent.mx !== 0) f.facing = intent.mx;
    startMove(d, f, def.moves.combo);
    return;
  }
  if (intent.dash && def.dashSpeed > 0 && intent.mx !== 0) {
    f.facing = intent.mx;
    setState(f, 'dash');
    sfx(d, 'dash');
    return;
  }
  walk(f, intent, def);
};

const dash: Handler = (d, f, intent) => {
  const def = FIGHTERS[f.kind];
  f.vx = f.facing * def.dashSpeed;
  f.vz = intent.mz * def.speedZ * DASH_Z_FACTOR;
  if (intent.special && def.moves.special) {
    startSpecial(d, f, def.moves.special);
    return;
  }
  if (intent.attack && def.moves.dashAttack) {
    startMove(d, f, def.moves.dashAttack);
    return;
  }
  if (intent.jump && def.jumpV > 0) {
    startJump(d, f, def, f.facing * def.dashSpeed);
    return;
  }
  const released = intent.mx !== f.facing;
  if (f.stateTicks >= DASH_MAX_TICKS || (released && f.stateTicks >= DASH_MIN_TICKS)) setState(f, 'idle');
};

const air: Handler = (d, f, intent) => {
  const moves = FIGHTERS[f.kind].moves;
  const justLeftGround = f.stateTicks <= SPECIAL_WINDOW + 1 && f.y < SPECIAL_MAX_HEIGHT;
  if (intent.special && moves.special && justLeftGround) {
    startSpecial(d, f, moves.special);
    return;
  }
  if (!intent.attack || f.airAttacked) return;
  const move = Math.abs(f.vx) > FORWARD_JUMP_SPEED ? moves.jumpForward : moves.jumpNeutral;
  if (!move) return;
  f.airAttacked = true;
  startMove(d, f, move);
};

/** Attack pressed a tick or two before jump still becomes the special, cancelling the opening jab. */
const attack: Handler = (d, f, intent) => {
  const moves = FIGHTERS[f.kind].moves;
  const justStarted = f.stateTicks <= SPECIAL_WINDOW + 1 && f.frame === 0 && f.moveId === moves.combo;
  if (intent.special && moves.special && justStarted) {
    startSpecial(d, f, moves.special);
    return;
  }
  advanceMove(d, f, intent);
};

const hurt: Handler = (_d, f) => {
  f.vx *= HURT_FRICTION;
  if (f.stateTicks < f.stun) return;
  f.vx = 0;
  setState(f, 'idle');
};

const down: Handler = (_d, f) => {
  f.vx = 0;
  if (f.stateTicks >= DOWN_TICKS) setState(f, f.hp > 0 ? 'getup' : 'dead');
};

/** Invulnerable time on standing up. A boss gets enough to answer back, so he cannot be juggled forever. */
function wakeInvuln(f: FighterData): number {
  if (f.team === 'player') return WAKE_INVULN_PLAYER;
  return FIGHTERS[f.kind].ai?.type === 'boss' ? BOSS_WAKE_INVULN : WAKE_INVULN_ENEMY;
}

const getup: Handler = (_d, f) => {
  if (f.stateTicks < GETUP_TICKS) return;
  setState(f, 'idle');
  f.invuln = wakeInvuln(f);
  if (f.ai && FIGHTERS[f.kind].ai?.type === 'boss') {
    f.ai.cool = 0;
    f.ai.plan = null;
  }
};

const grabbing: Handler = (d, f, intent) => {
  const moves = FIGHTERS[f.kind].moves;
  f.vx = 0;
  f.vz = 0;
  const victim = findFighter(d, f.link);
  if (!victim || victim.state !== 'grabbed') {
    f.link = 0;
    setState(f, 'idle');
    return;
  }
  if (intent.jump || f.stateTicks > GRAB_HOLD_TICKS) {
    releaseGrab(d, f);
    return;
  }
  if (!intent.attack) return;
  if (intent.mx !== 0 && moves.throw) {
    f.facing = intent.mx;
    startMove(d, f, moves.throw);
  } else if (moves.pummel) {
    startMove(d, f, moves.pummel);
  }
};

const grabbed: Handler = (d, f) => {
  const grabber = findFighter(d, f.link);
  const stillHeld = grabber && grabber.link === f.id && (grabber.state === 'grabbing' || grabber.state === 'attack');
  if (!grabber || !stillHeld) {
    f.link = 0;
    setState(f, 'idle');
    return;
  }
  holdInPlace(grabber, f);
};

const none: Handler = () => undefined;

const HANDLERS: Readonly<Record<FighterState, Handler>> = {
  idle: ground,
  walk: ground,
  dash,
  air,
  attack,
  hurt,
  launched: none,
  down,
  getup,
  grabbing,
  grabbed,
  thrown: none,
  dead: none,
};

/** One tick of a fighter's state machine. Callers skip this while the fighter is in hitstop. */
export function updateFighter(d: Draft, f: FighterData, intent: Intent): void {
  f.stateTicks += 1;
  if (f.invuln > 0) f.invuln -= 1;
  if (f.buffer > 0) f.buffer -= 1;
  HANDLERS[f.state](d, f, intent);
}

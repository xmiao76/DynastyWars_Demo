import { clamp, sign } from '../../core/math';
import { AI_DEADZONE, AI_ONSCREEN_MARGIN, SCREEN_W } from '../../data/tuning';
import { NO_INTENT, type Axis, type Facing, type FighterData, type Intent } from '../types';

/** Extra room beyond the movement deadzone, so an enemy that reaches a clamped spot always counts as on screen. */
const SCREEN_INSET = AI_DEADZONE + 3;
const LINE_UP_DEADZONE = 1;

export function faceToward(f: FighterData, targetX: number): Facing {
  return sign(targetX - f.x) || f.facing;
}

function axisToward(delta: number, deadzone: number): Axis {
  return Math.abs(delta) > deadzone ? sign(delta) : 0;
}

/** Walk toward a point while keeping eyes on the player. */
export function moveToward(f: FighterData, tx: number, tz: number, lookAtX: number): Intent {
  return {
    ...NO_INTENT,
    mx: axisToward(tx - f.x, AI_DEADZONE),
    mz: axisToward(tz - f.z, AI_DEADZONE),
    face: faceToward(f, lookAtX),
  };
}

/**
 * Like `moveToward`, but lines up exactly in depth. Used when an attack needs
 * the lane matched more closely than the loose loitering deadzone allows.
 */
export function lineUpOn(f: FighterData, tx: number, tz: number, lookAtX: number): Intent {
  return {
    ...NO_INTENT,
    mx: axisToward(tx - f.x, AI_DEADZONE),
    mz: axisToward(tz - f.z, LINE_UP_DEADZONE),
    face: faceToward(f, lookAtX),
  };
}

/** Keep a target x inside the visible screen, so enemies never loiter out of sight. */
export function clampToScreen(x: number, cameraX: number): number {
  const inset = AI_ONSCREEN_MARGIN + SCREEN_INSET;
  return clamp(x, cameraX + inset, cameraX + SCREEN_W - inset);
}

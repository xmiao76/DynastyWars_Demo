import { DOUBLE_TAP_WINDOW, SPECIAL_WINDOW } from '../data/tuning';
import { BTN, type Axis, type Draft, type Intent } from './types';

function axis(buttons: number, negative: number, positive: number): Axis {
  const value = (buttons & positive ? 1 : 0) - (buttons & negative ? 1 : 0);
  return value as Axis;
}

/** Double-tapping a horizontal direction starts a dash. */
function readDash(d: Draft, edges: number): boolean {
  const tapped: Axis = edges & BTN.RIGHT ? 1 : edges & BTN.LEFT ? -1 : 0;
  if (tapped === 0) return false;
  const input = d.input;
  const isDash = input.tapDir === tapped && d.tick - input.tapTick <= DOUBLE_TAP_WINDOW;
  input.tapDir = isDash ? 0 : tapped;
  input.tapTick = d.tick;
  return isDash;
}

/** Attack and jump pressed within a few ticks of each other trigger the special. */
function readSpecial(d: Draft, buttons: number, attackEdge: boolean, jumpEdge: boolean): boolean {
  const input = d.input;
  if (attackEdge) input.attackTick = d.tick;
  if (jumpEdge) input.jumpTick = d.tick;
  if (!attackEdge && !jumpEdge) return false;
  const bothHeld = (buttons & BTN.ATTACK) !== 0 && (buttons & BTN.JUMP) !== 0;
  return bothHeld && Math.abs(input.attackTick - input.jumpTick) <= SPECIAL_WINDOW;
}

/** Turn this tick's button mask into the player's intent, updating tap history in the draft. */
export function readPlayerIntent(d: Draft, buttons: number): Intent {
  const edges = buttons & ~d.prevButtons;
  const attackEdge = (edges & BTN.ATTACK) !== 0;
  const jumpEdge = (edges & BTN.JUMP) !== 0;
  const dash = readDash(d, edges);
  const special = readSpecial(d, buttons, attackEdge, jumpEdge);
  return {
    mx: axis(buttons, BTN.LEFT, BTN.RIGHT),
    mz: axis(buttons, BTN.UP, BTN.DOWN),
    attack: attackEdge && !special,
    jump: jumpEdge && !special,
    special,
    dash,
  };
}

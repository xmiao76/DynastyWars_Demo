import { BTN } from '../../sim/types';

/** One tick of input: held buttons, buttons newly pressed, and the system keys. */
export interface InputFrame {
  readonly buttons: number;
  readonly pressed: number;
  readonly pause: boolean;
  readonly mute: boolean;
}

const KEY_BUTTONS: Readonly<Record<string, number>> = {
  ArrowLeft: BTN.LEFT,
  ArrowRight: BTN.RIGHT,
  ArrowUp: BTN.UP,
  ArrowDown: BTN.DOWN,
  KeyA: BTN.LEFT,
  KeyD: BTN.RIGHT,
  KeyW: BTN.UP,
  KeyS: BTN.DOWN,
  KeyJ: BTN.ATTACK,
  KeyZ: BTN.ATTACK,
  KeyK: BTN.JUMP,
  KeyX: BTN.JUMP,
  Enter: BTN.START,
  Space: BTN.START,
};
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const MUTE_KEYS = new Set(['KeyM']);

export interface Keyboard {
  /** Read and clear the edge state. Call exactly once per simulation tick. */
  poll(): InputFrame;
  dispose(): void;
}

export function createKeyboard(target: Window): Keyboard {
  const held = new Set<string>();
  // Keys pressed since the last poll. A tap shorter than one frame would otherwise be missed.
  const tapped = new Set<string>();
  let previous = 0;
  let pauseEdge = false;
  let muteEdge = false;

  const down = (e: KeyboardEvent): void => {
    // Leave browser shortcuts such as Ctrl+S or Alt+D alone.
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code in KEY_BUTTONS || PAUSE_KEYS.has(e.code) || MUTE_KEYS.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    held.add(e.code);
    tapped.add(e.code);
    if (PAUSE_KEYS.has(e.code)) pauseEdge = true;
    if (MUTE_KEYS.has(e.code)) muteEdge = true;
  };
  const up = (e: KeyboardEvent): void => {
    held.delete(e.code);
  };
  const blur = (): void => {
    held.clear();
    tapped.clear();
  };

  target.addEventListener('keydown', down);
  target.addEventListener('keyup', up);
  target.addEventListener('blur', blur);

  return {
    poll() {
      let buttons = 0;
      for (const code of held) buttons |= KEY_BUTTONS[code] ?? 0;
      for (const code of tapped) buttons |= KEY_BUTTONS[code] ?? 0;
      tapped.clear();
      const frame: InputFrame = { buttons, pressed: buttons & ~previous, pause: pauseEdge, mute: muteEdge };
      previous = buttons;
      pauseEdge = false;
      muteEdge = false;
      return frame;
    },
    dispose() {
      target.removeEventListener('keydown', down);
      target.removeEventListener('keyup', up);
      target.removeEventListener('blur', blur);
    },
  };
}

import { SCREEN_H, SCREEN_W, TICKS_PER_SECOND } from '../data/tuning';

const STEP_MS = 1000 / TICKS_PER_SECOND;
const MAX_STEPS_PER_FRAME = 5;

export interface Loop {
  stop(): void;
}

/**
 * Fixed-timestep loop: `update` runs exactly 60 times per second of real time
 * (catching up at most a few steps after a stall), `draw` once per frame.
 * If either throws, the loop stops and `onError` is told why.
 */
export function startLoop(update: () => void, draw: () => void, onError: (error: unknown) => void): Loop {
  let last = performance.now();
  let accumulator = 0;
  let handle = 0;
  let running = true;

  const runFrame = (now: number): void => {
    accumulator += Math.min(now - last, STEP_MS * MAX_STEPS_PER_FRAME);
    last = now;
    let steps = 0;
    while (accumulator >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      update();
      accumulator -= STEP_MS;
      steps += 1;
    }
    draw();
  };
  const frame = (now: number): void => {
    if (!running) return;
    try {
      runFrame(now);
    } catch (error) {
      // Stop rather than leave a frozen picture with no explanation.
      running = false;
      onError(error);
      return;
    }
    handle = requestAnimationFrame(frame);
  };
  const onVisibility = (): void => {
    // Do not try to catch up for time spent in a hidden tab.
    last = performance.now();
    accumulator = 0;
  };
  document.addEventListener('visibilitychange', onVisibility);
  handle = requestAnimationFrame(frame);

  return {
    stop() {
      running = false;
      cancelAnimationFrame(handle);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}

/**
 * Size the canvas element to the largest whole multiple of the game resolution
 * that fits the window. The multiple is counted in device pixels, so every game
 * pixel stays the same size at 125% or 150% display scaling too.
 */
export function fitCanvas(canvas: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1;
  const fitW = (window.innerWidth * dpr) / SCREEN_W;
  const fitH = (window.innerHeight * dpr) / SCREEN_H;
  const scale = Math.max(1, Math.floor(Math.min(fitW, fitH)));
  canvas.style.width = `${(SCREEN_W * scale) / dpr}px`;
  canvas.style.height = `${(SCREEN_H * scale) / dpr}px`;
}

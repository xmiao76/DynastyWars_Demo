import { createKeyboard, type InputFrame } from './app/input/keyboard';
import { fitCanvas, startLoop } from './app/loop';
import { createTitleScene } from './app/scenes/title';
import type { Scene, Services } from './app/services';
import { createAudioEngine } from './audio';
import { FIRST_STAGE_ID, getStage } from './data/stages';
import { SCREEN_H, SCREEN_W } from './data/tuning';
import { buildAtlas } from './gfx/rig/atlas';
import { buildRedCliffsBackdrop } from './gfx/render/backdrop-redcliffs';
import { buildMiscSprites } from './gfx/render/misc-sprites';
import { drawText } from './gfx/render/text';

/** What the dev-only debug hook is allowed to touch. */
export interface GameHandle {
  readonly canvas: HTMLCanvasElement;
  readonly services: Services;
  getScene(): Scene;
  setScene(scene: Scene): void;
  /** Run one update with the given input and redraw, bypassing the real-time loop. */
  manualTick(input: InputFrame): void;
  setManual(manual: boolean): void;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function showFatal(message: string): void {
  const box = document.createElement('p');
  box.textContent = `Sorry, the game has stopped: ${message}`;
  box.style.cssText = 'color:#f0d0a0;font:16px system-ui,sans-serif;padding:24px;max-width:40em';
  document.body.replaceChildren(box);
}

function buildServices(): Services {
  const sprites = buildMiscSprites();
  return {
    atlas: buildAtlas(),
    sprites,
    backdrop: buildRedCliffsBackdrop(getStage(FIRST_STAGE_ID), sprites),
    audio: createAudioEngine(),
  };
}

function boot(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) throw new Error('this browser does not support the 2D canvas.');
  canvas.width = SCREEN_W;
  canvas.height = SCREEN_H;
  ctx.imageSmoothingEnabled = false;
  fitCanvas(canvas);
  window.addEventListener('resize', () => fitCanvas(canvas));

  const services = buildServices();
  const keyboard = createKeyboard(window);
  // Browsers only allow sound after a user gesture; unlock is safe to repeat.
  window.addEventListener('keydown', () => services.audio.unlock());
  window.addEventListener('pointerdown', () => services.audio.unlock());
  document.addEventListener('visibilitychange', () => services.audio.setSuspended(document.hidden));

  let scene: Scene = createTitleScene(services);
  let manual = false;

  const update = (input: InputFrame): void => {
    if (input.mute) services.audio.setMuted(!services.audio.isMuted());
    scene = scene.update(input);
  };
  const draw = (): void => {
    scene.draw(ctx);
    if (services.audio.isMuted()) drawText(ctx, 'MUTED', SCREEN_W - 4, SCREEN_H - 10, { align: 'right', color: '#8a80a8' });
  };

  startLoop(
    () => {
      if (!manual) update(keyboard.poll());
    },
    draw,
    (error) => showFatal(describeError(error)),
  );

  if (import.meta.env.DEV) {
    const handle: GameHandle = {
      canvas,
      services,
      getScene: () => scene,
      setScene: (next) => {
        scene = next;
      },
      manualTick: (input) => {
        update(input);
        draw();
      },
      setManual: (value) => {
        manual = value;
      },
    };
    void import('./app/debug').then((debug) => debug.installDebug(handle));
  }
}

try {
  boot();
} catch (error) {
  showFatal(describeError(error));
}

// Development only: loaded behind `import.meta.env.DEV`, so it is not in the production bundle.
// Lets tooling drive the game tick by tick and capture the canvas.
import type { GameHandle } from '../main';
import { createClearScene } from './scenes/clear';
import { createGameOverScene } from './scenes/gameover';
import { createPlayScene } from './scenes/play';

interface DebugApi {
  /** Take over from the real-time loop (or hand back). */
  manual(on: boolean): void;
  /** Advance `count` ticks holding `buttons`; they count as newly pressed on the first tick only. */
  tick(count?: number, buttons?: number): string;
  /** Press and release `buttons` over two ticks. */
  press(buttons: number): string;
  /** Send one pause key press. */
  pause(): string;
  scene(): string;
  world(): unknown;
  jump(to: 'play' | 'clear' | 'gameover', seed?: number): string;
  /** Save the canvas (enlarged by `scale`) as a PNG through the dev server's screenshot endpoint. */
  shot(name: string, scale?: number): Promise<string>;
}

export function installDebug(game: GameHandle): void {
  const api: DebugApi = {
    manual(on) {
      game.setManual(on);
    },
    tick(count = 1, buttons = 0) {
      for (let i = 0; i < count; i++) {
        game.manualTick({ buttons, pressed: i === 0 ? buttons : 0, pause: false, mute: false });
      }
      return game.getScene().name;
    },
    press(buttons) {
      api.tick(1, buttons);
      return api.tick(1, 0);
    },
    pause() {
      game.manualTick({ buttons: 0, pressed: 0, pause: true, mute: false });
      return game.getScene().name;
    },
    scene: () => game.getScene().name,
    world: () => game.getScene().world?.() ?? null,
    jump(to, seed = 1) {
      if (to === 'play') game.setScene(createPlayScene(game.services, seed));
      else if (to === 'clear') game.setScene(createClearScene(game.services, { score: 38000, kos: 40, ticks: 18000, continues: 0 }));
      else game.setScene(createGameOverScene(game.services, 12300));
      return game.getScene().name;
    },
    async shot(name, scale = 2) {
      const big = document.createElement('canvas');
      big.width = game.canvas.width * scale;
      big.height = game.canvas.height * scale;
      const ctx = big.getContext('2d');
      if (!ctx) return 'failed: no canvas';
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(game.canvas, 0, 0, big.width, big.height);
      const response = await fetch(`/__shot?name=${encodeURIComponent(name)}`, { method: 'POST', body: big.toDataURL('image/png') });
      return response.ok ? `saved ${name}` : `failed: ${response.status}`;
    },
  };
  (window as unknown as { __game: DebugApi }).__game = api;
}

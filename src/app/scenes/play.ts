import { FIRST_STAGE_ID, getStage } from '../../data/stages';
import type { StageDef } from '../../data/stages/types';
import { SCREEN_H, SCREEN_W } from '../../data/tuning';
import { createFx, spawnFx, updateFx, type FxState } from '../../gfx/render/fx';
import { createHud, drawHud, updateHud, type HudState } from '../../gfx/render/hud';
import { drawText } from '../../gfx/render/text';
import { drawWorld, type RenderDeps } from '../../gfx/render/world-renderer';
import { step } from '../../sim/step';
import type { SimEvent, World } from '../../sim/types';
import { createWorld } from '../../sim/world';
import type { InputFrame } from '../input/keyboard';
import type { Scene, Services } from '../services';
import { createClearScene } from './clear';
import { fadeIn } from './common';
import { createGameOverScene } from './gameover';
import { drawBossCard, drawContinue, drawPause } from './play-overlays';

const BOSS_INTRO_TICKS = 170;
const SLOWMO_TICKS = 110;
const SLOWMO_DIVISOR = 3;
const TOAST_TICKS = 130;
const SEED_MASK = 0xffffff;

/** Everything the play scene remembers between ticks, besides the world itself. */
interface PlayState {
  world: World;
  age: number;
  paused: boolean;
  /** Ticks left on the boss introduction card; the fight is frozen meanwhile. */
  bossIntro: number;
  /** Ticks of slow motion left after the boss's defeat. */
  slowmo: number;
  continueSeconds: number;
  toast: string;
  toastTicks: number;
  next: Scene | null;
  readonly fx: FxState;
  readonly hud: HudState;
  readonly stage: StageDef;
}

function onSection(state: PlayState, services: Services, index: number, boss: boolean): void {
  state.toast = state.stage.sections[index]?.nameEn ?? '';
  state.toastTicks = TOAST_TICKS;
  if (!boss) return;
  state.bossIntro = BOSS_INTRO_TICKS;
  services.audio.playSong('boss');
  services.audio.playSfx('war_horn');
}

/** React to something the simulation reported this tick. */
function onEvent(state: PlayState, services: Services, e: SimEvent): void {
  const { world } = state;
  switch (e.t) {
    case 'sfx':
      services.audio.playSfx(e.id);
      return;
    case 'section':
      onSection(state, services, e.index, e.boss);
      return;
    case 'bossPhase':
      services.audio.playSfx('boss_roar');
      return;
    case 'bossDown':
      state.slowmo = SLOWMO_TICKS;
      services.audio.playSong(null);
      return;
    case 'continue':
      state.continueSeconds = e.seconds;
      return;
    case 'gameover':
      state.next = createGameOverScene(services, world.player.score);
      return;
    case 'clear':
      state.next = createClearScene(services, {
        score: world.player.score,
        kos: world.player.kos,
        ticks: world.player.playTicks,
        continues: world.player.continues,
      });
      return;
    default:
      return;
  }
}

function advance(state: PlayState, services: Services, input: InputFrame): void {
  const result = step(state.world, input.buttons);
  state.world = result.world;
  for (const e of result.events) onEvent(state, services, e);
  spawnFx(state.fx, result.events, services.sprites);
  updateHud(state.hud, state.world, result.events);
}

function updatePlay(state: PlayState, services: Services, input: InputFrame): void {
  state.age += 1;
  if (input.pause && state.world.phase === 'play' && state.bossIntro === 0) {
    state.paused = !state.paused;
    services.audio.playSfx('pause');
  }
  if (state.paused) return;
  if (state.toastTicks > 0) state.toastTicks -= 1;
  updateFx(state.fx, state.world.cameraX);
  if (state.bossIntro > 0) {
    state.bossIntro -= 1;
    return;
  }
  // The killing blow on the boss plays out in slow motion.
  if (state.slowmo > 0 && --state.slowmo % SLOWMO_DIVISOR !== 0) return;
  advance(state, services, input);
}

function drawPlay(ctx: CanvasRenderingContext2D, state: PlayState, services: Services, deps: RenderDeps): void {
  drawWorld(ctx, state.world, deps, state.fx, state.age);
  drawHud(ctx, state.world, state.hud, services.sprites, state.age);
  if (state.toastTicks > 0 && state.bossIntro === 0) {
    drawText(ctx, state.toast, SCREEN_W / 2, SCREEN_H - 12, { align: 'center', color: '#f0d0a0' });
  }
  if (state.bossIntro > 0) drawBossCard(ctx, state.age);
  if (state.world.phase === 'continue') drawContinue(ctx, state.continueSeconds, state.age);
  if (state.paused) drawPause(ctx);
  fadeIn(ctx, state.age);
}

/** The fight itself: steps the simulation and presents what it reports. */
export function createPlayScene(services: Services, seed: number = Date.now() & SEED_MASK): Scene {
  const deps: RenderDeps = { atlas: services.atlas, sprites: services.sprites, backdrop: services.backdrop };
  const state: PlayState = {
    world: createWorld(FIRST_STAGE_ID, seed),
    age: 0,
    paused: false,
    bossIntro: 0,
    slowmo: 0,
    continueSeconds: 0,
    toast: '',
    toastTicks: 0,
    next: null,
    fx: createFx(),
    hud: createHud(),
    stage: getStage(FIRST_STAGE_ID),
  };
  services.audio.playSong('stage');
  const scene: Scene = {
    name: 'play',
    world: () => state.world,
    update(input: InputFrame): Scene {
      updatePlay(state, services, input);
      return state.next ?? scene;
    },
    draw(ctx) {
      drawPlay(ctx, state, services, deps);
    },
  };
  return scene;
}

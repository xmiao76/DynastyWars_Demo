import type { AudioEngine } from '../audio';
import type { Atlas } from '../gfx/rig/atlas';
import type { Backdrop } from '../gfx/render/backdrop-redcliffs';
import type { MiscSprites } from '../gfx/render/misc-sprites';
import type { World } from '../sim/types';
import type { InputFrame } from './input/keyboard';

/** Shared, long-lived things every scene can use. Built once at boot. */
export interface Services {
  readonly atlas: Atlas;
  readonly sprites: MiscSprites;
  readonly backdrop: Backdrop;
  readonly audio: AudioEngine;
}

/** A screen of the game. `update` returns the next scene, or itself to stay. */
export interface Scene {
  readonly name: string;
  update(input: InputFrame): Scene;
  draw(ctx: CanvasRenderingContext2D): void;
  /** The fight in progress, for the play scene only (used by dev tooling). */
  world?(): World;
}

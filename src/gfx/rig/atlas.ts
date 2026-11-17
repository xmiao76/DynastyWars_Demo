import type { FighterKind } from '../../sim/types';
import { PALETTE_RGB } from '../art/palettes';
import { FALLBACK_POSE, POSES } from '../art/poses';
import { SKINS } from '../art/skins';
import { bakePose, type BakedFrame } from './bake';

/** A baked frame as drawable canvases: normal colours and an all-white copy for hit flashes. */
export interface SpriteFrame {
  readonly canvas: HTMLCanvasElement;
  readonly white: HTMLCanvasElement;
  readonly w: number;
  readonly h: number;
  readonly ax: number;
  readonly ay: number;
}

export type Atlas = Readonly<Record<FighterKind, Readonly<Record<string, SpriteFrame>>>>;

const OPAQUE = 255;

/** Turn palette indices into a canvas. With `flat`, every inked pixel takes that one colour. */
export function indexedToCanvas(w: number, h: number, px: Uint8Array, flat?: readonly [number, number, number]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.');
  const image = ctx.createImageData(w, h);
  for (let i = 0; i < px.length; i++) {
    if (px[i] === 0) continue;
    const rgb = flat ?? PALETTE_RGB[px[i]];
    image.data[i * 4] = rgb[0];
    image.data[i * 4 + 1] = rgb[1];
    image.data[i * 4 + 2] = rgb[2];
    image.data[i * 4 + 3] = OPAQUE;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function toSprite(frame: BakedFrame): SpriteFrame {
  return {
    canvas: indexedToCanvas(frame.w, frame.h, frame.px),
    white: indexedToCanvas(frame.w, frame.h, frame.px, [255, 255, 255]),
    w: frame.w,
    h: frame.h,
    ax: frame.ax,
    ay: frame.ay,
  };
}

/** Bake every pose of every fighter. Done once at load. */
export function buildAtlas(): Atlas {
  const atlas: Partial<Record<FighterKind, Record<string, SpriteFrame>>> = {};
  for (const kind of Object.keys(POSES) as FighterKind[]) {
    const frames: Record<string, SpriteFrame> = {};
    for (const [id, pose] of Object.entries(POSES[kind])) frames[id] = toSprite(bakePose(SKINS[kind], pose));
    atlas[kind] = frames;
  }
  return atlas as Atlas;
}

export function frameOf(atlas: Atlas, kind: FighterKind, poseId: string): SpriteFrame {
  return atlas[kind][poseId] ?? atlas[kind][FALLBACK_POSE];
}

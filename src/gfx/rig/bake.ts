import { INK, SMEAR_BODY, SMEAR_EDGE } from '../art/palettes';
import { contentBounds, createBuffer, cropBuffer, type IndexedBuffer } from '../raster/indexed-buffer';
import { outline } from '../raster/outline';
import { ringArc, smearArc } from '../raster/primitives';
import { drawFigure } from './figure';
import type { Pose, Skin } from './pose';
import { solve } from './skeleton';

const BUFFER_W = 250;
const BUFFER_H = 176;
const ORIGIN_X = 116;
const ORIGIN_Y = 146;
const RING_THICKNESS = 4;

/** One finished sprite frame: palette indices plus the anchor (the point under the feet). */
export interface BakedFrame {
  readonly w: number;
  readonly h: number;
  readonly ax: number;
  readonly ay: number;
  readonly px: Uint8Array;
}

function over(dest: IndexedBuffer, src: IndexedBuffer): void {
  for (let i = 0; i < src.px.length; i++) {
    if (src.px[i] !== 0) dest.px[i] = src.px[i];
  }
}

/** Pose the rig, draw it, outline it and add any swing smear; returns a tightly cropped frame. */
export function bakePose(skin: Skin, pose: Pose): BakedFrame {
  const figure = createBuffer(BUFFER_W, BUFFER_H);
  const scratch = createBuffer(BUFFER_W, BUFFER_H);
  const out = createBuffer(BUFFER_W, BUFFER_H);
  const joints = solve(pose, skin.prop, ORIGIN_X, ORIGIN_Y);
  drawFigure(figure, scratch, joints, skin, pose);
  outline(figure, INK);

  const smear = pose.smear;
  // Smears are not outlined, and a spin ring passes behind the body and then in front of it.
  if (smear?.kind === 'ring') {
    ringArc(out, ORIGIN_X, ORIGIN_Y - smear.height, smear.rx, smear.ry, RING_THICKNESS, false, SMEAR_BODY);
  }
  over(out, figure);
  if (smear?.kind === 'arc') {
    const [hx, hy] = joints.handN;
    smearArc(out, hx, hy, smear.from, smear.to, smear.inner, smear.outer, SMEAR_EDGE, SMEAR_BODY);
  }
  if (smear?.kind === 'ring') {
    ringArc(out, ORIGIN_X, ORIGIN_Y - smear.height, smear.rx, smear.ry, RING_THICKNESS, true, SMEAR_EDGE);
  }

  const bounds = contentBounds(out);
  if (!bounds) return { w: 1, h: 1, ax: 0, ay: 0, px: new Uint8Array(1) };
  const cropped = cropBuffer(out, bounds);
  return { w: cropped.w, h: cropped.h, ax: ORIGIN_X - bounds.x0, ay: ORIGIN_Y - bounds.y0, px: cropped.px };
}

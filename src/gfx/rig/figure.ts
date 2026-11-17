import { INK } from '../art/palettes';
import { drawWeapon } from '../art/weapons';
import type { IndexedBuffer } from '../raster/indexed-buffer';
import { layer } from '../raster/outline';
import { capsule, ellipse, poly, stamp, stroke, type Ramp } from '../raster/primitives';
import type { Pose, Skin, Vec } from './pose';
import type { Joints } from './skeleton';

const UPRIGHT_LIMIT = 42;
const SKIRT_EXTRA_RADIUS = 1;

/** Far-side limbs sit in shadow: shift the ramp one step darker. */
function dim(ramp: Ramp): Ramp {
  return [ramp[0], ramp[0], ramp[1]];
}

function bone(b: IndexedBuffer, from: Vec, to: Vec, r0: number, r1: number, ramp: Ramp): void {
  capsule(b, from[0], from[1], r0, to[0], to[1], r1, ramp);
}

function lerp(a: Vec, b: Vec, t: number): Vec {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function drawArm(b: IndexedBuffer, skin: Skin, shoulder: Vec, elbow: Vec, hand: Vec, far: boolean): void {
  const p = skin.prop;
  const tone = far ? dim : (r: Ramp): Ramp => r;
  bone(b, shoulder, elbow, p.rArm, p.rArm * 0.9, tone(skin.sleeve));
  bone(b, elbow, hand, p.rFore, p.rFore * 0.85, tone(skin.fore));
  ellipse(b, hand[0], hand[1], p.hand, p.hand, tone(skin.skin));
}

function drawLeg(b: IndexedBuffer, skin: Skin, hip: Vec, knee: Vec, ankle: Vec, toe: Vec, far: boolean): void {
  const p = skin.prop;
  const tone = far ? dim : (r: Ramp): Ramp => r;
  bone(b, hip, knee, p.rThigh, p.rShin + 0.4, tone(skin.pants));
  bone(b, knee, ankle, p.rShin + 0.2, p.rShin * 0.85, tone(skin.boots));
  bone(b, [ankle[0], ankle[1] + 1], toe, p.rShin * 0.8, 1.3, tone(skin.boots));
}

/** Where a hem of the given length ends along one leg. */
function hemPoint(hip: Vec, knee: Vec, ankle: Vec, thigh: number, length: number): Vec {
  if (length <= thigh) return lerp(hip, knee, length / thigh);
  return lerp(knee, ankle, Math.min(1, (length - thigh) / thigh));
}

function drawSkirt(b: IndexedBuffer, skin: Skin, j: Joints): void {
  if (!skin.skirt || skin.skirtLen <= 0) return;
  const p = skin.prop;
  const r = p.rThigh + SKIRT_EXTRA_RADIUS;
  const endN = hemPoint(j.hipN, j.kneeN, j.ankleN, p.thigh, skin.skirtLen);
  const endF = hemPoint(j.hipF, j.kneeF, j.ankleF, p.thigh, skin.skirtLen);
  poly(b, [...j.hipN, ...j.hipF, ...endF, ...endN], skin.skirt[0]);
  bone(b, j.hipF, endF, r, r + 0.6, dim(skin.skirt));
  bone(b, j.hipN, endN, r, r + 0.6, skin.skirt);
  if (skin.trim) hemTrim(b, j.hipN, endN, r, skin.trim);
}

/** A band of trim across the bottom of a robe panel. */
function hemTrim(b: IndexedBuffer, hip: Vec, end: Vec, r: number, color: number): void {
  const dx = end[0] - hip[0];
  const dy = end[1] - hip[1];
  const len = Math.hypot(dx, dy) || 1;
  const cx = end[0] + (dx / len) * (r - 1.5);
  const cy = end[1] + (dy / len) * (r - 1.5);
  const half = r * 0.75;
  stroke(b, cx - (dy / len) * half, cy + (dx / len) * half, cx + (dy / len) * half, cy - (dx / len) * half, 0.7, color);
}

function drawTorso(b: IndexedBuffer, skin: Skin, j: Joints): void {
  const p = skin.prop;
  drawSkirt(b, skin, j);
  bone(b, j.hip, j.chest, p.rWaist, p.rChest, skin.top);
  // The side vector points toward the figure's back.
  const side: Vec = [j.up[1], -j.up[0]];
  if (skin.trim) {
    const lapelTop: Vec = [j.neck[0] - side[0] * 2, j.neck[1] - side[1] * 2];
    const lapelEnd: Vec = [j.hip[0] - side[0] * (p.rWaist - 1) + j.up[0] * 6, j.hip[1] - side[1] * (p.rWaist - 1) + j.up[1] * 6];
    stroke(b, lapelTop[0], lapelTop[1], lapelEnd[0], lapelEnd[1], 0.7, skin.trim);
  }
  const waist: Vec = [j.hip[0] + j.up[0] * 2, j.hip[1] + j.up[1] * 2];
  stroke(
    b,
    waist[0] + side[0] * p.rWaist,
    waist[1] + side[1] * p.rWaist,
    waist[0] - side[0] * p.rWaist,
    waist[1] - side[1] * p.rWaist,
    1,
    skin.belt,
  );
}

function drawCape(b: IndexedBuffer, skin: Skin, j: Joints): void {
  if (!skin.cape) return;
  const p = skin.prop;
  const side: Vec = [j.up[1], -j.up[0]];
  const at = (alongUp: number, back: number): Vec => [
    j.hip[0] + j.up[0] * alongUp + side[0] * back,
    j.hip[1] + j.up[1] * alongUp + side[1] * back,
  ];
  const hem = -p.thigh * 0.95;
  poly(b, [...at(p.torso + 1, -1), ...at(p.torso, p.rChest + 3), ...at(hem, p.rWaist + 10), ...at(hem + 2, 0)], skin.cape[1]);
  const edgeTop = at(p.torso, p.rChest + 3);
  const edgeLow = at(hem, p.rWaist + 10);
  stroke(b, edgeTop[0], edgeTop[1], edgeLow[0], edgeLow[1], 1, skin.cape[0]);
}

/** Heads are hand-drawn stamps while upright; a tumbling or lying body gets a simple rounded head instead. */
function drawHead(b: IndexedBuffer, skin: Skin, j: Joints, pose: Pose): void {
  if (Math.abs(j.bodyAngle) <= UPRIGHT_LIMIT) {
    stamp(b, j.neck[0], j.neck[1], pose.head === 'pain' ? skin.headPain : skin.head, skin.legend);
    return;
  }
  const cx = j.neck[0] + j.up[0] * 5;
  const cy = j.neck[1] + j.up[1] * 5;
  if (skin.beard) bone(b, [cx, cy], [j.chest[0] - j.up[0] * 5, j.chest[1] - j.up[1] * 5 - 2], 3, 1.5, skin.beard);
  ellipse(b, cx, cy, 5, 5, skin.skin);
  ellipse(b, cx + j.up[0] * 3, cy + j.up[1] * 3, 4.6, 4.2, skin.hat);
}

/**
 * Draw the whole figure back to front. Each group is drawn on the scratch
 * `part` buffer and then layered onto `main`, which leaves a dark line
 * wherever one group overlaps another.
 */
export function drawFigure(main: IndexedBuffer, part: IndexedBuffer, j: Joints, skin: Skin, pose: Pose): void {
  const flush = (): void => layer(main, part, INK);
  drawCape(part, skin, j);
  flush();
  if (pose.behind) {
    drawWeapon(part, skin.weapon, j, pose);
    flush();
  }
  drawArm(part, skin, j.shoulderF, j.elbowF, j.handF, true);
  flush();
  drawLeg(part, skin, j.hipF, j.kneeF, j.ankleF, j.toeF, true);
  flush();
  drawLeg(part, skin, j.hipN, j.kneeN, j.ankleN, j.toeN, false);
  flush();
  drawTorso(part, skin, j);
  flush();
  drawHead(part, skin, j, pose);
  flush();
  if (!pose.behind) {
    drawWeapon(part, skin.weapon, j, pose);
    flush();
  }
  if (skin.pad) ellipse(part, j.shoulderN[0], j.shoulderN[1] - 1, 4.4, 3.4, skin.pad);
  drawArm(part, skin, j.shoulderN, j.elbowN, j.handN, false);
  flush();
  if (pose.grip2 !== undefined && !pose.behind) {
    ellipse(part, j.handF[0], j.handF[1], skin.prop.hand, skin.prop.hand, dim(skin.skin));
    flush();
  }
}

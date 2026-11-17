import type { IndexedBuffer } from '../raster/indexed-buffer';
import { capsule, poly, stroke, type Ramp } from '../raster/primitives';
import type { Joints } from '../rig/skeleton';
import type { Pose, Vec, WeaponKind } from '../rig/pose';
import { C } from './palettes';

/** Maps weapon-local coordinates (along the shaft, across toward the cutting edge) to buffer pixels. */
type Local = (a: number, c: number) => Vec;

function frame(hand: Vec, dir: Vec): Local {
  const [ux, uy] = dir;
  return (a, c) => [hand[0] + ux * a - uy * c, hand[1] + uy * a + ux * c];
}

function shape(b: IndexedBuffer, at: Local, pts: readonly (readonly [number, number])[], color: number): void {
  const flat: number[] = [];
  for (const [a, c] of pts) flat.push(...at(a, c));
  poly(b, flat, color);
}

function shaft(b: IndexedBuffer, at: Local, from: number, to: number, ramp: Ramp, r = 1.1): void {
  const p0 = at(from, 0);
  const p1 = at(to, 0);
  capsule(b, p0[0], p0[1], r, p1[0], p1[1], r, ramp);
}

/** A tassel always hangs straight down, whatever the weapon's angle. */
function tassel(b: IndexedBuffer, from: Vec, length: number): void {
  capsule(b, from[0], from[1] + 1, 1.5, from[0] - 1, from[1] + length, 0.8, C.red);
}

// 青龙偃月刀: long shaft, gold socket, broad crescent blade with a hooked spine.
const GUANDAO_BLADE = [[36, -2], [41, -4.5], [52, -5], [60, -2.5], [63, 1.5], [58, 6.5], [49, 8.5], [42, 7.5], [37, 3]] as const;
const GUANDAO_EDGE = [[42, 7.5], [49, 8.5], [58, 6.5], [63, 1.5], [60, 2], [56, 4.5], [49, 6], [43, 5.5]] as const;
const GUANDAO_HOOK = [[45, -4.5], [49, -9], [52, -5]] as const;

function guandao(b: IndexedBuffer, at: Local): void {
  shaft(b, at, -40, 35, C.wood);
  shaft(b, at, -43, -40, C.steel, 1.4);
  shape(b, at, GUANDAO_BLADE, C.steel[1]);
  shape(b, at, GUANDAO_HOOK, C.steel[1]);
  shape(b, at, GUANDAO_EDGE, C.steel[2]);
  const s0 = at(40, -3.5);
  const s1 = at(58, -2.5);
  stroke(b, s0[0], s0[1], s1[0], s1[1], 0.6, C.steel[0]);
  shaft(b, at, 33, 37, C.gold, 2.2);
  tassel(b, at(34, 2), 8);
}

const SWORD_BLADE = [[2, -1.6], [15, -2.6], [21, -1], [22, 1.6], [17, 3], [2, 1.6]] as const;
const SWORD_EDGE = [[2, 0.4], [17, 1.8], [22, 1.6], [17, 3], [2, 1.6]] as const;

function sword(b: IndexedBuffer, at: Local): void {
  shaft(b, at, -4, 1, C.leather);
  shape(b, at, SWORD_BLADE, C.steel[1]);
  shape(b, at, SWORD_EDGE, C.steel[2]);
  const g0 = at(1, -3.2);
  const g1 = at(1, 3.2);
  stroke(b, g0[0], g0[1], g1[0], g1[1], 0.9, C.gold[1]);
}

const SPEAR_HEAD = [[35, 0], [38, -2.8], [47, 0], [38, 2.8]] as const;
const SPEAR_SHINE = [[38, 0], [38, 2.8], [47, 0]] as const;

function spear(b: IndexedBuffer, at: Local): void {
  shaft(b, at, -20, 36, C.wood, 1);
  shape(b, at, SPEAR_HEAD, C.steel[1]);
  shape(b, at, SPEAR_SHINE, C.steel[2]);
  tassel(b, at(34, 1), 6);
}

const SABRE_BLADE = [[2, -2], [14, -3], [24, -2.6], [31, 1], [27, 4.5], [21, 4], [13, 2.8], [2, 2]] as const;
const SABRE_EDGE = [[2, 0.8], [13, 1.6], [21, 2.6], [31, 1], [27, 4.5], [21, 4], [13, 2.8], [2, 2]] as const;

function sabre(b: IndexedBuffer, at: Local): void {
  shaft(b, at, -5, 1, C.red);
  shape(b, at, SABRE_BLADE, C.steel[1]);
  shape(b, at, SABRE_EDGE, C.steel[2]);
  const g0 = at(1, -3.6);
  const g1 = at(1, 3.6);
  stroke(b, g0[0], g0[1], g1[0], g1[1], 1, C.gold[1]);
}

function limb(b: IndexedBuffer, from: Vec, to: Vec, r: number, ramp: Ramp): void {
  capsule(b, from[0], from[1], r, to[0], to[1], r, ramp);
}

/** The bow is held upright in the near hand; when drawn, the far hand pulls the string and an arrow is nocked. */
function bow(b: IndexedBuffer, at: Local, j: Joints, drawn: boolean): void {
  const tipA = at(-3, -14);
  const tipB = at(-3, 14);
  limb(b, tipA, at(2, -7), 1, C.wood);
  limb(b, at(2, -7), at(3, 0), 1.2, C.wood);
  limb(b, at(3, 0), at(2, 7), 1.2, C.wood);
  limb(b, at(2, 7), tipB, 1, C.wood);
  if (!drawn) {
    stroke(b, tipA[0], tipA[1], tipB[0], tipB[1], 0.5, C.cloth[1]);
    return;
  }
  const pull = j.handF;
  stroke(b, tipA[0], tipA[1], pull[0], pull[1], 0.5, C.cloth[1]);
  stroke(b, pull[0], pull[1], tipB[0], tipB[1], 0.5, C.cloth[1]);
  const head = at(12, 0);
  stroke(b, pull[0], pull[1], head[0], head[1], 0.6, C.wood[2]);
  shape(b, at, [[11, -1.6], [15, 0], [11, 1.6]], C.steel[2]);
}

/** The command flag the boss raises to call reinforcements. */
function flag(b: IndexedBuffer, at: Local): void {
  shaft(b, at, -12, 46, C.wood, 1);
  const top = at(45, 0);
  const low = at(24, 0);
  // The banner streams backward and droops a little, independent of pole angle.
  const banner = [top[0], top[1], top[0] - 24, top[1] + 5, top[0] - 17, low[1] - 2, low[0], low[1]];
  poly(b, banner, C.red[1]);
  poly(b, [top[0], top[1], top[0] - 24, top[1] + 5, top[0] - 22, top[1] + 8, top[0], top[1] + 3], C.red[2]);
  stroke(b, top[0] - 24, top[1] + 5, top[0] - 17, low[1] - 2, 0.6, C.gold[1]);
  shaft(b, at, 45, 48, C.gold, 1.6);
}

/** Draw a fighter's weapon in the near hand. */
export function drawWeapon(b: IndexedBuffer, kind: WeaponKind, j: Joints, pose: Pose): void {
  const at = frame(j.handN, j.weaponDir);
  if (pose.prop === 'flag') {
    flag(b, at);
    return;
  }
  switch (kind) {
    case 'guandao':
      guandao(b, at);
      return;
    case 'sword':
      sword(b, at);
      return;
    case 'spear':
      spear(b, at);
      return;
    case 'sabre':
      sabre(b, at);
      return;
    case 'bow':
      bow(b, at, j, pose.prop === 'drawn');
      return;
    case 'none':
      return;
  }
}

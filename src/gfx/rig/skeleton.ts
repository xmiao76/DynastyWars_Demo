import { dirOf } from '../raster/primitives';
import type { Pose, Proportions, Vec } from './pose';

const DEG = Math.PI / 180;
export const FOOT_HEIGHT = 2;
const DEFAULT_WEAPON_ANGLE = 170;
const DEFAULT_FAR_ARM: Vec = [10, 20];
const EPSILON = 0.01;

export interface Joints {
  readonly hip: Vec;
  readonly chest: Vec;
  readonly neck: Vec;
  readonly shoulderN: Vec;
  readonly elbowN: Vec;
  readonly handN: Vec;
  readonly shoulderF: Vec;
  readonly elbowF: Vec;
  readonly handF: Vec;
  readonly hipN: Vec;
  readonly kneeN: Vec;
  readonly ankleN: Vec;
  readonly toeN: Vec;
  readonly hipF: Vec;
  readonly kneeF: Vec;
  readonly ankleF: Vec;
  readonly toeF: Vec;
  /** Unit vector along the weapon, toward its tip. */
  readonly weaponDir: Vec;
  /** Unit vector from hip to chest. */
  readonly up: Vec;
  /** Torso rotation from upright, degrees. */
  readonly bodyAngle: number;
}

function add(a: Vec, b: Vec): Vec {
  return [a[0] + b[0], a[1] + b[1]];
}

function along(from: Vec, dir: Vec, dist: number): Vec {
  return [from[0] + dir[0] * dist, from[1] + dir[1] * dist];
}

/**
 * Two-bone IK. Returns the middle joint and the (reach-clamped) end.
 * `prefer` scores a candidate middle joint; the higher-scoring bend wins.
 */
function ik(root: Vec, target: Vec, l1: number, l2: number, prefer: (mid: Vec) => number): readonly [Vec, Vec] {
  let dx = target[0] - root[0];
  let dy = target[1] - root[1];
  let d = Math.hypot(dx, dy);
  if (d < EPSILON) {
    dx = 0;
    dy = 1;
    d = 1;
  }
  const reach = Math.min(Math.max(d, Math.abs(l1 - l2) + EPSILON), l1 + l2 - EPSILON);
  const ux = dx / d;
  const uy = dy / d;
  const a = (l1 * l1 - l2 * l2 + reach * reach) / (2 * reach);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const m1: Vec = [root[0] + ux * a - uy * h, root[1] + uy * a + ux * h];
  const m2: Vec = [root[0] + ux * a + uy * h, root[1] + uy * a - ux * h];
  return [prefer(m1) >= prefer(m2) ? m1 : m2, along(root, [ux, uy], reach)];
}

const kneeForward = (mid: Vec): number => mid[0];
const elbowDown = (mid: Vec): number => mid[1] - mid[0] * 0.5;

interface BodySpace {
  [name: string]: Vec;
}

function solveArms(pose: Pose, p: Proportions, body: BodySpace, weaponDir: Vec): void {
  const [a0, a1] = pose.armN;
  body.elbowN = along(body.shoulderN, dirOf(a0), p.upperArm);
  body.handN = along(body.elbowN, dirOf(a0 + a1), p.foreArm);
  if (pose.grip2 !== undefined) {
    const grip = along(body.handN, weaponDir, pose.grip2);
    const [elbow, hand] = ik(body.shoulderF, grip, p.upperArm, p.foreArm, elbowDown);
    body.elbowF = elbow;
    body.handF = hand;
    return;
  }
  const [b0, b1] = pose.armF ?? DEFAULT_FAR_ARM;
  body.elbowF = along(body.shoulderF, dirOf(b0), p.upperArm);
  body.handF = along(body.elbowF, dirOf(b0 + b1), p.foreArm);
}

function solveLegs(pose: Pose, p: Proportions, body: BodySpace, hipH: number): void {
  const spun = (pose.spin ?? 0) !== 0;
  const [rdx, rdy] = pose.root ?? [0, 0];
  // Planted feet stay where they are when the hip shifts; spun poses carry the legs with the body.
  const target = (f: Vec): Vec =>
    spun ? [f[0], hipH - FOOT_HEIGHT - f[1]] : [f[0] - rdx, hipH - FOOT_HEIGHT - rdy - f[1]];
  const [kneeN, ankleN] = ik(body.hipN, target(pose.footN), p.thigh, p.shin, kneeForward);
  const [kneeF, ankleF] = ik(body.hipF, target(pose.footF), p.thigh, p.shin, kneeForward);
  body.kneeN = kneeN;
  body.ankleN = ankleN;
  body.toeN = add(ankleN, [p.foot, 1]);
  body.kneeF = kneeF;
  body.ankleF = ankleF;
  body.toeF = add(ankleF, [p.foot, 1]);
}

/** Work out every joint position for a pose, in buffer pixels, with the feet's ground point at (ox, oy). */
export function solve(pose: Pose, p: Proportions, ox: number, oy: number): Joints {
  const lean = pose.lean ?? 0;
  const spin = pose.spin ?? 0;
  const hipH = p.thigh + p.shin + FOOT_HEIGHT;
  const up = dirOf(180 - lean);
  const weaponDir = dirOf(pose.weapon ?? DEFAULT_WEAPON_ANGLE);
  const chest: Vec = [up[0] * p.torso, up[1] * p.torso];
  // Three-quarter view: the near shoulder sits back, the far one forward.
  const back: Vec = [up[1], -up[0]];
  const body: BodySpace = {
    hip: [0, 0],
    chest,
    neck: along(chest, up, p.neck),
    shoulderN: add(along(chest, back, p.shoulder), [0, 1]),
    shoulderF: along(chest, back, -p.shoulder - 0.5),
    hipN: [-p.hipW, 0],
    hipF: [p.hipW, -0.5],
  };
  solveArms(pose, p, body, weaponDir);
  solveLegs(pose, p, body, hipH);

  const cos = Math.cos(spin * DEG);
  const sin = Math.sin(spin * DEG);
  const [rdx, rdy] = pose.root ?? [0, 0];
  const hipX = ox + rdx;
  const hipY = pose.hipY !== undefined ? oy - pose.hipY : oy - hipH + rdy;
  const rot = (v: Vec): Vec => [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos];
  const place = (v: Vec): Vec => {
    const r = rot(v);
    return [hipX + r[0], hipY + r[1]];
  };
  return {
    hip: place(body.hip),
    chest: place(body.chest),
    neck: place(body.neck),
    shoulderN: place(body.shoulderN),
    elbowN: place(body.elbowN),
    handN: place(body.handN),
    shoulderF: place(body.shoulderF),
    elbowF: place(body.elbowF),
    handF: place(body.handF),
    hipN: place(body.hipN),
    kneeN: place(body.kneeN),
    ankleN: place(body.ankleN),
    toeN: place(body.toeN),
    hipF: place(body.hipF),
    kneeF: place(body.kneeF),
    ankleF: place(body.ankleF),
    toeF: place(body.toeF),
    weaponDir: rot(weaponDir),
    up: rot(up),
    bodyAngle: lean + spin,
  };
}

import type { Ramp, Stamp } from '../raster/primitives';

export type Vec = readonly [number, number];

/** Crescent left by a vertical swing: the blade swept between two weapon angles. */
export interface ArcSmear {
  readonly kind: 'arc';
  readonly from: number;
  readonly to: number;
  readonly inner: number;
  readonly outer: number;
}

/** Flattened ring left by a horizontal spin, centred on the body at a given height. */
export interface RingSmear {
  readonly kind: 'ring';
  readonly rx: number;
  readonly ry: number;
  readonly height: number;
}

export type Smear = ArcSmear | RingSmear;

/**
 * One key pose of the shared humanoid rig, facing right.
 * Angles are in degrees: 0 points straight down, 90 forward, 180 straight up.
 */
export interface Pose {
  /** Hip offset from the neutral stance: [forward, down]. Feet stay planted. */
  readonly root?: Vec;
  /** Torso lean, positive forward. */
  readonly lean?: number;
  /** Whole-body rotation about the hip, positive forward. Used for falling and lying. */
  readonly spin?: number;
  /** Hip height above the ground for spun poses. */
  readonly hipY?: number;
  readonly head?: 'normal' | 'pain';
  /** Near arm: [shoulder angle, extra elbow bend]. */
  readonly armN: Vec;
  /** Far arm, unless `grip2` puts that hand on the weapon. */
  readonly armF?: Vec;
  /** Weapon angle, measured the same way as limbs. */
  readonly weapon?: number;
  /** Distance along the weapon from the near hand at which the far hand grips. */
  readonly grip2?: number;
  /** Foot targets relative to the ground point under the neutral hip: [forward, up]. */
  readonly footN: Vec;
  readonly footF: Vec;
  /** Draw the weapon behind the body. */
  readonly behind?: boolean;
  readonly smear?: Smear;
  /** Pose-specific prop: a drawn bow, or the boss's command flag instead of his sabre. */
  readonly prop?: 'drawn' | 'flag';
}

export interface Proportions {
  readonly thigh: number;
  readonly shin: number;
  readonly torso: number;
  readonly neck: number;
  readonly upperArm: number;
  readonly foreArm: number;
  readonly rThigh: number;
  readonly rShin: number;
  readonly rArm: number;
  readonly rFore: number;
  readonly rChest: number;
  readonly rWaist: number;
  readonly hand: number;
  readonly foot: number;
  /** Half the shoulder width, and half the hip width. */
  readonly shoulder: number;
  readonly hipW: number;
}

export type WeaponKind = 'guandao' | 'sword' | 'spear' | 'bow' | 'sabre' | 'none';

export interface Skin {
  readonly prop: Proportions;
  readonly skin: Ramp;
  readonly top: Ramp;
  readonly sleeve: Ramp;
  readonly fore: Ramp;
  readonly pants: Ramp;
  readonly boots: Ramp;
  /** Robe or tunic hem; null for none. */
  readonly skirt: Ramp | null;
  /** How far down the leg the hem reaches, in pixels from the hip. */
  readonly skirtLen: number;
  readonly belt: number;
  readonly pad: Ramp | null;
  readonly cape: Ramp | null;
  /** Lapel trim colour across the chest; 0 for none. */
  readonly trim: number;
  readonly hat: Ramp;
  readonly beard: Ramp | null;
  readonly head: Stamp;
  readonly headPain: Stamp;
  readonly legend: Readonly<Record<string, number>>;
  readonly weapon: WeaponKind;
}

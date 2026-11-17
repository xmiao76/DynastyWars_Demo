import type { FighterKind, HazardKind, PickupKind, PropKind } from '../../sim/types';

export type SpawnSide = 'left' | 'right';

export interface SpawnDef {
  readonly kind: FighterKind;
  readonly side: SpawnSide;
  readonly z: number;
  /** Ticks after the wave starts. */
  readonly delay: number;
}

export interface WaveDef {
  readonly spawns: readonly SpawnDef[];
}

export interface HazardSpawn {
  readonly kind: HazardKind;
  readonly x: number;
  readonly z: number;
  readonly halfW: number;
  readonly halfD: number;
  /** Warning time before a one-shot strike lands; 0 for persistent fire. */
  readonly delay: number;
}

export interface SectionDef {
  readonly id: string;
  readonly nameEn: string;
  /** Camera x at which the screen locks for this fight. */
  readonly lockX: number;
  readonly waves: readonly WaveDef[];
  readonly boss?: boolean;
  /** Set pieces triggered when the section locks. */
  readonly hazards?: readonly HazardSpawn[];
}

/** A stretch of the stage where the walkable depth is narrower, e.g. a gangplank. */
export interface ZBand {
  readonly x0: number;
  readonly x1: number;
  readonly zMin: number;
  readonly zMax: number;
}

export interface PropSpawn {
  readonly kind: PropKind;
  readonly x: number;
  readonly z: number;
  readonly drop: PickupKind | null;
}

export interface StageDef {
  readonly id: string;
  readonly nameZh: string;
  readonly nameEn: string;
  readonly width: number;
  readonly zMin: number;
  readonly zMax: number;
  readonly bands: readonly ZBand[];
  /** Horizontal distance over which a band narrows in. */
  readonly bandRamp: number;
  readonly startX: number;
  readonly startZ: number;
  readonly sections: readonly SectionDef[];
  readonly props: readonly PropSpawn[];
  /** Hazards present from the start (fire patches). */
  readonly hazards: readonly HazardSpawn[];
}

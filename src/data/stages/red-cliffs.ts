import type { FighterKind } from '../../sim/types';
import type { SpawnDef, SpawnSide, StageDef } from './types';

function spawn(kind: FighterKind, side: SpawnSide, z: number, delay: number): SpawnDef {
  return { kind, side, z, delay };
}

/**
 * 赤壁 Red Cliffs: the chained Wei fleet at night, already burning.
 * Three ships left to right: a boarding prow, a troop ship, and the flagship.
 */
export const RED_CLIFFS: StageDef = {
  id: 'red-cliffs',
  nameZh: '赤壁',
  nameEn: 'RED CLIFFS',
  width: 2760,
  zMin: 152,
  zMax: 212,
  bandRamp: 26,
  bands: [
    { x0: 664, x1: 896, zMin: 170, zMax: 198 }, // gangplank between ships
    { x0: 1852, x1: 1928, zMin: 164, zMax: 202 }, // chained bridge to the flagship
  ],
  startX: 70,
  startZ: 184,
  sections: [
    {
      id: 'prow',
      nameEn: 'PROW',
      lockX: 40,
      waves: [
        { spawns: [spawn('sword', 'right', 182, 0), spawn('sword', 'right', 202, 45), spawn('sword', 'right', 164, 95)] },
        { spawns: [spawn('sword', 'left', 176, 0), spawn('sword', 'right', 196, 25)] },
        { spawns: [spawn('spear', 'right', 186, 0), spawn('sword', 'left', 170, 30), spawn('sword', 'right', 204, 60)] },
      ],
    },
    {
      id: 'gangplank',
      nameEn: 'GANGPLANK',
      lockX: 580,
      waves: [
        { spawns: [spawn('spear', 'right', 184, 0), spawn('spear', 'left', 184, 60)] },
        { spawns: [spawn('sword', 'right', 180, 0), spawn('sword', 'left', 188, 35), spawn('spear', 'right', 190, 70)] },
        { spawns: [spawn('archer', 'right', 184, 0), spawn('sword', 'left', 180, 40)] },
      ],
    },
    {
      id: 'archer-deck',
      nameEn: 'ARCHER DECK',
      lockX: 990,
      waves: [
        {
          spawns: [
            spawn('archer', 'right', 160, 0),
            spawn('archer', 'right', 204, 30),
            spawn('sword', 'right', 182, 70),
            spawn('sword', 'left', 190, 110),
          ],
        },
        {
          spawns: [
            spawn('sword', 'right', 170, 0),
            spawn('sword', 'right', 200, 30),
            spawn('spear', 'left', 186, 55),
            spawn('sword', 'left', 166, 95),
          ],
        },
      ],
    },
    {
      id: 'burning-deck',
      nameEn: 'BURNING DECK',
      lockX: 1410,
      hazards: [{ kind: 'mast', x: 1610, z: 184, halfW: 62, halfD: 9, delay: 110 }],
      waves: [
        {
          spawns: [
            spawn('spear', 'right', 170, 0),
            spawn('sword', 'right', 196, 30),
            spawn('sword', 'left', 182, 65),
            spawn('spear', 'left', 200, 115),
          ],
        },
        { spawns: [spawn('brute', 'right', 186, 0), spawn('sword', 'left', 170, 60), spawn('sword', 'right', 200, 105)] },
        { spawns: [spawn('archer', 'right', 158, 0), spawn('spear', 'right', 190, 30), spawn('spear', 'left', 176, 60)] },
      ],
    },
    {
      id: 'foredeck',
      nameEn: 'FLAGSHIP FOREDECK',
      lockX: 1960,
      waves: [
        { spawns: [spawn('brute', 'right', 182, 0), spawn('archer', 'right', 160, 50), spawn('archer', 'left', 204, 95)] },
        {
          spawns: [
            spawn('brute', 'left', 190, 0),
            spawn('sword', 'right', 170, 30),
            spawn('sword', 'right', 200, 60),
            spawn('spear', 'right', 186, 100),
          ],
        },
        {
          spawns: [
            spawn('spear', 'left', 172, 0),
            spawn('spear', 'right', 198, 25),
            spawn('sword', 'right', 180, 55),
            spawn('archer', 'left', 206, 90),
          ],
        },
      ],
    },
    {
      id: 'command-deck',
      nameEn: 'COMMAND DECK',
      lockX: 2376,
      boss: true,
      waves: [{ spawns: [spawn('yujin', 'right', 182, 30)] }],
    },
  ],
  props: [
    { kind: 'crate', x: 250, z: 158, drop: 'bun' },
    { kind: 'jar', x: 410, z: 206, drop: 'gold' },
    { kind: 'crate', x: 1060, z: 158, drop: 'bun' },
    { kind: 'barrel', x: 1160, z: 170, drop: null },
    { kind: 'barrel', x: 1290, z: 204, drop: null },
    { kind: 'crate', x: 1450, z: 206, drop: 'chicken' },
    { kind: 'jar', x: 2010, z: 158, drop: 'gold' },
    { kind: 'crate', x: 2300, z: 206, drop: 'chicken' },
    { kind: 'jar', x: 2420, z: 158, drop: 'bun' },
  ],
  hazards: [
    { kind: 'fire', x: 1520, z: 160, halfW: 26, halfD: 7, delay: 0 },
    { kind: 'fire', x: 1650, z: 205, halfW: 30, halfD: 6, delay: 0 },
    { kind: 'fire', x: 1748, z: 176, halfW: 22, halfD: 7, delay: 0 },
  ],
};

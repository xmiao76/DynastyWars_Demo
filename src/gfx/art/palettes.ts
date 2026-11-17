import type { Ramp } from '../raster/primitives';

/**
 * The master sprite palette. Index 0 is transparent. Ramps run shadow ->
 * midtone -> highlight, with shadows pulled toward purple and highlights
 * toward yellow so the sprites sit in the fire-lit night scene.
 */
const hexes: string[] = ['#000000'];

function color(hex: string): number {
  hexes.push(hex);
  return hexes.length - 1;
}

function ramp(dark: string, mid: string, light: string): Ramp {
  return [color(dark), color(mid), color(light)];
}

export const INK = color('#150d1c');
export const WHITE = color('#ffffff');
export const SMEAR_EDGE = color('#f4fbff');
export const SMEAR_BODY = color('#9fd4f0');
export const EYE = color('#1a1018');

export const C = {
  skin: ramp('#8a4a3a', '#c98a62', '#eebb8c'),
  skinRed: ramp('#7a1f24', '#b8413a', '#e07a5a'),
  skinTan: ramp('#6e3c28', '#a8683e', '#d49a62'),
  green: ramp('#14432e', '#24734a', '#4fae5e'),
  gold: ramp('#8a5a18', '#d9a030', '#ffe070'),
  steel: ramp('#4a5068', '#8f9ab8', '#e3ecfa'),
  wood: ramp('#3e2418', '#6e4226', '#a06a3a'),
  black: ramp('#100c14', '#2a2434', '#4a4458'),
  cloth: ramp('#8a8a9c', '#c8c8d8', '#f6f6ff'),
  blue: ramp('#1c2a5a', '#3050a0', '#5a86d8'),
  teal: ramp('#16403e', '#267068', '#4aa894'),
  purple: ramp('#3a1c50', '#6a348a', '#a060c0'),
  red: ramp('#6a1420', '#b02a2a', '#e85a40'),
  leather: ramp('#3a2418', '#5e3c24', '#8a5c38'),
  iron: ramp('#24283a', '#444c66', '#7884a0'),
  grey: ramp('#2c2c3c', '#4a4a60', '#70708c'),
  straw: ramp('#7a5a22', '#b89040', '#e0c070'),
  fire: ramp('#c8301c', '#f08020', '#ffe060'),
} as const;

function parse(hex: string): readonly [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const PALETTE_RGB: readonly (readonly [number, number, number])[] = hexes.map(parse);

export function paletteHex(index: number): string {
  return hexes[index] ?? '#ff00ff';
}

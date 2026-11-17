import type { Ramp, Stamp } from '../raster/primitives';
import { C, EYE, WHITE } from './palettes';

/**
 * Hand-drawn heads, facing right. Faces carry each character's identity, so
 * these are authored pixel by pixel rather than generated.
 *
 * Legend: d/s/S skin shadow/mid/light, k/K hair, h/g/G hat, y/Y gold or straw,
 * n/m/M metal, p/P red, w eye white, e pupil, b brim shadow.
 */

/** 关羽: green cap with gold band, red face, and the long beard he is famous for. */
export const HEAD_GUANYU: Stamp = {
  ax: 8,
  ay: 11,
  rows: [
    '.....hhggggG.....',
    '....hgggggggGG...',
    '...hggggggggGGG..',
    '..hgggggggggggGG.',
    '..hggggggggggGGg.',
    '..yYyyyyyyyyYYyy.',
    '..kkddssssssSSSs.',
    '.kkkdkkkksskkkkS.',
    '.kkkdswwesswwes..',
    '.kkkddsssssssSSS.',
    '.kkkkdssssssssS..',
    '..kkkkkkKkkkkkk..',
    '..kkkkkKkkkKkkk..',
    '...kkkKkkkKkkkk..',
    '...kkkKkkKkkkk...',
    '...kkKkkkKkkkk...',
    '....kKkkkKkkk....',
    '....kKkkKkkk.....',
    '.....kKkKkk......',
    '.....kkKkk.......',
    '......kkkk.......',
    '......kkk........',
    '.......k.........',
  ],
};

/** 刀兵: iron helmet with a red tassel. */
export const HEAD_SWORD: Stamp = {
  ax: 6,
  ay: 12,
  rows: [
    '......p......',
    '.....ppP.....',
    '....nmmmM....',
    '...nmmmmMM...',
    '..nmmmmmmMM..',
    '.nmmmmmmmmMM.',
    '.nnnnnnnnnnn.',
    '..kddssSSSs..',
    '..kdswwesse..',
    '..kddssssSS..',
    '...ddsssss...',
    '....dssss....',
  ],
};

/** 枪兵: wide straw hat. */
export const HEAD_SPEAR: Stamp = {
  ax: 7,
  ay: 12,
  rows: [
    '.......y.......',
    '......yYy......',
    '.....yyYYy.....',
    '....yyyyYYy....',
    '...yyyyyyYYy...',
    '.yyyyyyyyyyYYy.',
    'bbbbbbbbbbbbbbb',
    '...kddssSSSs...',
    '...kdswwesse...',
    '...kddssssSS...',
    '....ddsssss....',
    '.....dssss.....',
  ],
};

/** 弓兵: topknot and a red headband. */
export const HEAD_ARCHER: Stamp = {
  ax: 6,
  ay: 10,
  rows: [
    '.....kkk.....',
    '....kkKkk....',
    '...kkkkkkk...',
    '..kkKkkkkKk..',
    '..ppppPPppp..',
    '..kddssSSSs..',
    '..kdswwesse..',
    '..kddssssSS..',
    '...ddsssss...',
    '....dssss....',
  ],
};

/** 力士: shaved head, topknot, heavy brow and moustache. */
export const HEAD_BRUTE: Stamp = {
  ax: 7,
  ay: 12,
  rows: [
    '......kk.......',
    '.....kkkk......',
    '....dssSSSS....',
    '...dssssssSSS..',
    '..dsssssssssSS.',
    '..dkkkssskkkSS.',
    '..dswwesswwesS.',
    '..ddsssssssSSS.',
    '..dkkkkkkkkkss.',
    '..ddkkkkkkkks..',
    '...ddssssss....',
    '....dssss......',
  ],
};

/** 于禁: officer's helmet with gold crest and red plume, cheek guards, short beard. */
export const HEAD_YUJIN: Stamp = {
  ax: 6,
  ay: 13,
  rows: [
    '......pP.......',
    '.....ppPP......',
    '.....pppP......',
    '......pp.......',
    '....nmmyMMM....',
    '...nmmmyMMMM...',
    '..nmmmmyMMMMM..',
    '.nmmmmmyMMMMMM.',
    '.yyyyyyyyyyyyy.',
    '.nkddssSSSsn...',
    '.nkdswwessen...',
    '.nkddssssSSn...',
    '..kkkkkkkkks...',
    '...kkkkkkks....',
    '....kkkkk......',
  ],
};

/** The same head with the eyes screwed shut. */
export function painOf(head: Stamp): Stamp {
  return { ...head, rows: head.rows.map((row) => row.replace(/wwe/g, 'kkk').replace(/e/g, 'k')) };
}

export function headLegend(skin: Ramp, hat: Ramp, metal: Ramp, band: Ramp = C.gold): Readonly<Record<string, number>> {
  return {
    d: skin[0],
    s: skin[1],
    S: skin[2],
    k: C.black[0],
    K: C.black[2],
    h: hat[0],
    g: hat[1],
    G: hat[2],
    y: band[1],
    Y: band[2],
    b: band[0],
    n: metal[0],
    m: metal[1],
    M: metal[2],
    p: C.red[1],
    P: C.red[2],
    w: WHITE,
    e: EYE,
  };
}

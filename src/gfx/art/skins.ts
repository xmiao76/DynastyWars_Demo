import type { FighterKind } from '../../sim/types';
import type { Proportions, Skin } from '../rig/pose';
import { C } from './palettes';
import {
  HEAD_ARCHER,
  HEAD_BRUTE,
  HEAD_GUANYU,
  HEAD_SPEAR,
  HEAD_SWORD,
  HEAD_YUJIN,
  headLegend,
  painOf,
} from './stamps';

const HERO: Proportions = {
  thigh: 12, shin: 13, torso: 20, neck: 2, upperArm: 10, foreArm: 9,
  rThigh: 5, rShin: 3.8, rArm: 4.2, rFore: 3.6, rChest: 9, rWaist: 7, hand: 2.8, foot: 5.5,
  shoulder: 4, hipW: 2.5,
};

const SOLDIER: Proportions = {
  thigh: 10, shin: 11, torso: 16, neck: 2, upperArm: 8, foreArm: 8,
  rThigh: 4.2, rShin: 3.2, rArm: 3.4, rFore: 3, rChest: 7.2, rWaist: 5.8, hand: 2.4, foot: 5,
  shoulder: 3.5, hipW: 2,
};

const BRUTE: Proportions = {
  thigh: 11, shin: 12, torso: 21, neck: 2, upperArm: 10, foreArm: 10,
  rThigh: 5.6, rShin: 4.4, rArm: 5.2, rFore: 4.6, rChest: 11.5, rWaist: 9.5, hand: 3.6, foot: 6.5,
  shoulder: 6, hipW: 3,
};

const OFFICER: Proportions = {
  thigh: 13, shin: 14, torso: 21, neck: 2, upperArm: 10, foreArm: 10,
  rThigh: 5, rShin: 3.8, rArm: 4.2, rFore: 3.6, rChest: 9.5, rWaist: 7.4, hand: 2.8, foot: 6,
  shoulder: 4.5, hipW: 2.5,
};

/** Every fighter is the same rig; identity comes from proportions, colours, head and weapon. */
export const SKINS: Readonly<Record<FighterKind, Skin>> = {
  guanyu: {
    prop: HERO,
    skin: C.skinRed, top: C.green, sleeve: C.green, fore: C.gold, pants: C.grey, boots: C.black,
    skirt: C.green, skirtLen: 13, belt: C.gold[1], pad: C.gold, cape: null, trim: C.gold[1],
    hat: C.green, beard: C.black,
    head: HEAD_GUANYU, headPain: painOf(HEAD_GUANYU), legend: headLegend(C.skinRed, C.green, C.steel),
    weapon: 'guandao',
  },
  sword: {
    prop: SOLDIER,
    skin: C.skin, top: C.blue, sleeve: C.blue, fore: C.leather, pants: C.grey, boots: C.leather,
    skirt: C.blue, skirtLen: 8, belt: C.black[1], pad: null, cape: null, trim: 0,
    hat: C.iron, beard: null,
    head: HEAD_SWORD, headPain: painOf(HEAD_SWORD), legend: headLegend(C.skin, C.iron, C.iron),
    weapon: 'sword',
  },
  spear: {
    prop: SOLDIER,
    skin: C.skin, top: C.teal, sleeve: C.teal, fore: C.leather, pants: C.grey, boots: C.leather,
    skirt: C.teal, skirtLen: 9, belt: C.black[1], pad: null, cape: null, trim: 0,
    hat: C.straw, beard: null,
    head: HEAD_SPEAR, headPain: painOf(HEAD_SPEAR), legend: headLegend(C.skin, C.straw, C.iron, C.straw),
    weapon: 'spear',
  },
  archer: {
    prop: SOLDIER,
    skin: C.skin, top: C.purple, sleeve: C.cloth, fore: C.skin, pants: C.grey, boots: C.leather,
    skirt: C.purple, skirtLen: 7, belt: C.red[1], pad: null, cape: null, trim: 0,
    hat: C.black, beard: null,
    head: HEAD_ARCHER, headPain: painOf(HEAD_ARCHER), legend: headLegend(C.skin, C.black, C.iron),
    weapon: 'bow',
  },
  brute: {
    prop: BRUTE,
    skin: C.skinTan, top: C.skinTan, sleeve: C.skinTan, fore: C.iron, pants: C.grey, boots: C.black,
    skirt: C.leather, skirtLen: 7, belt: C.gold[1], pad: null, cape: null, trim: 0,
    hat: C.skinTan, beard: null,
    head: HEAD_BRUTE, headPain: painOf(HEAD_BRUTE), legend: headLegend(C.skinTan, C.black, C.iron),
    weapon: 'none',
  },
  yujin: {
    prop: OFFICER,
    skin: C.skin, top: C.iron, sleeve: C.purple, fore: C.iron, pants: C.purple, boots: C.black,
    skirt: C.purple, skirtLen: 15, belt: C.gold[1], pad: C.gold, cape: C.red, trim: 0,
    hat: C.iron, beard: C.black,
    head: HEAD_YUJIN, headPain: painOf(HEAD_YUJIN), legend: headLegend(C.skin, C.iron, C.iron),
    weapon: 'sabre',
  },
};

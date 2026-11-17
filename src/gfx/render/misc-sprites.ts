import { C, INK, WHITE } from '../art/palettes';
import { SKINS } from '../art/skins';
import { createBuffer, type IndexedBuffer } from '../raster/indexed-buffer';
import { outline } from '../raster/outline';
import { capsule, ellipse, poly, rect, stamp, stroke } from '../raster/primitives';
import { indexedToCanvas } from '../rig/atlas';

/** A small drawable with its anchor (usually bottom centre). */
export interface Sprite {
  readonly canvas: HTMLCanvasElement;
  readonly w: number;
  readonly h: number;
  readonly ax: number;
  readonly ay: number;
}

function finish(b: IndexedBuffer, ax: number, ay: number): Sprite {
  return { canvas: indexedToCanvas(b.w, b.h, b.px), w: b.w, h: b.h, ax, ay };
}

function crate(): Sprite {
  const b = createBuffer(22, 23);
  rect(b, 1, 6, 20, 16, C.wood[1]);
  rect(b, 1, 1, 20, 5, C.wood[2]);
  rect(b, 1, 6, 20, 1, C.wood[0]);
  rect(b, 7, 7, 1, 15, C.wood[0]);
  rect(b, 14, 7, 1, 15, C.wood[0]);
  rect(b, 1, 13, 20, 1, C.wood[0]);
  stroke(b, 2, 20, 19, 8, 0.6, C.wood[2]);
  outline(b, INK);
  return finish(b, 11, 22);
}

function jar(): Sprite {
  const b = createBuffer(18, 23);
  ellipse(b, 9, 13, 7, 8, C.teal);
  rect(b, 5, 3, 8, 4, C.teal[1]);
  ellipse(b, 9, 3, 5, 2, C.teal);
  rect(b, 3, 12, 12, 1, C.cloth[2]);
  rect(b, 4, 15, 10, 1, C.teal[0]);
  outline(b, INK);
  return finish(b, 9, 22);
}

/** Oil barrel: the red band and flame mark warn that it explodes. */
function barrel(): Sprite {
  const b = createBuffer(20, 25);
  ellipse(b, 10, 13, 8, 10, C.leather);
  rect(b, 3, 4, 14, 18, C.leather[1]);
  rect(b, 3, 4, 3, 18, C.leather[0]);
  rect(b, 14, 4, 3, 18, C.leather[2]);
  ellipse(b, 10, 4, 7, 2.4, C.wood);
  rect(b, 3, 8, 14, 2, C.iron[1]);
  rect(b, 3, 18, 14, 2, C.iron[1]);
  poly(b, [10, 10, 13, 15, 10, 17, 7, 15], C.fire[0]);
  poly(b, [10, 12, 12, 15, 10, 16, 8, 15], C.fire[2]);
  outline(b, INK);
  return finish(b, 10, 24);
}

/** 包子 steamed bun on a plate. */
function bun(): Sprite {
  const b = createBuffer(16, 12);
  rect(b, 1, 9, 14, 2, C.teal[2]);
  ellipse(b, 8, 6, 5.5, 4.5, C.cloth);
  rect(b, 8, 2, 1, 3, C.cloth[0]);
  rect(b, 6, 3, 1, 2, C.cloth[0]);
  rect(b, 10, 3, 1, 2, C.cloth[0]);
  outline(b, INK);
  return finish(b, 8, 11);
}

/** 烤鸡 roast chicken on a plate. */
function chicken(): Sprite {
  const b = createBuffer(20, 14);
  rect(b, 1, 11, 18, 2, C.teal[2]);
  ellipse(b, 9, 7, 7, 5, C.gold);
  ellipse(b, 6, 6, 3, 2.5, C.leather);
  capsule(b, 14, 5, 2, 17, 2, 1.2, C.leather);
  ellipse(b, 18, 1.6, 1.2, 1.2, C.cloth);
  outline(b, INK);
  return finish(b, 10, 13);
}

/** 元宝 gold ingot. */
function gold(): Sprite {
  const b = createBuffer(16, 11);
  poly(b, [1, 4, 4, 9, 12, 9, 15, 4, 12, 5, 4, 5], C.gold[1]);
  ellipse(b, 8, 4, 3.6, 2.6, C.gold);
  rect(b, 5, 8, 6, 1, C.gold[0]);
  rect(b, 6, 3, 2, 1, WHITE);
  outline(b, INK);
  return finish(b, 8, 10);
}

function arrow(): Sprite {
  const b = createBuffer(18, 7);
  rect(b, 2, 3, 12, 1, C.wood[2]);
  poly(b, [13, 1, 17, 3, 13, 5], C.steel[2]);
  rect(b, 1, 2, 3, 1, C.cloth[2]);
  rect(b, 1, 4, 3, 1, C.cloth[2]);
  outline(b, INK);
  return finish(b, 9, 3);
}

const SPARK_SIZE = 31;
const SPARK_CENTER = 15;
const SPARK_RAYS = 8;

/** A burst of rays that grows and thins over three frames. */
function sparkFrames(core: number, rays: number, lengths: readonly number[]): Sprite[] {
  return lengths.map((length, frameIndex) => {
    const b = createBuffer(SPARK_SIZE, SPARK_SIZE);
    for (let i = 0; i < SPARK_RAYS; i++) {
      const angle = (i / SPARK_RAYS) * Math.PI * 2 + frameIndex * 0.3;
      const reach = i % 2 === 0 ? length : length * 0.6;
      const inner = frameIndex * 3;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      stroke(b, SPARK_CENTER + cos * inner, SPARK_CENTER + sin * inner, SPARK_CENTER + cos * reach, SPARK_CENTER + sin * reach, frameIndex === 0 ? 1.3 : 0.7, rays);
    }
    if (frameIndex < 2) ellipse(b, SPARK_CENTER, SPARK_CENTER, 4 - frameIndex * 2, 4 - frameIndex * 2, [core, core, core]);
    return finish(b, SPARK_CENTER, SPARK_CENTER);
  });
}

function dustFrames(): Sprite[] {
  return [3, 5, 7].map((spread, i) => {
    const b = createBuffer(30, 14);
    const r = 3.2 - i * 0.7;
    ellipse(b, 15 - spread, 9, r + 1, r, C.cloth);
    ellipse(b, 15 + spread, 9, r + 1, r, C.cloth);
    ellipse(b, 15, 7 - i, r, r, C.cloth);
    return finish(b, 15, 12);
  });
}

/** Tiny deterministic generator so flames look ragged but are identical on every load. */
function jitter(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff - 0.5;
  };
}

function flameFrames(w: number, h: number, count: number): Sprite[] {
  const frames: Sprite[] = [];
  for (let f = 0; f < count; f++) {
    const b = createBuffer(w, h);
    const next = jitter(977 + f * 131);
    const cx = w / 2;
    [C.fire[0], C.fire[1], C.fire[2]].forEach((color, layer) => {
      const scale = 1 - layer * 0.28;
      const half = (w / 2 - 1) * scale;
      const top = h - 2 - (h - 4) * scale;
      const tipX = cx + next() * w * 0.5;
      const left = cx - half * (0.8 + next() * 0.3);
      const right = cx + half * (0.8 + next() * 0.3);
      const mid = h - 2 - (h - 4) * scale * (0.45 + next() * 0.2);
      poly(b, [cx - half, h - 2, left, mid, tipX, top, right, mid + next() * 3, cx + half, h - 2], color);
      ellipse(b, cx, h - 3, half, 2.5, [color, color, color]);
    });
    frames.push(finish(b, Math.floor(cx), h - 1));
  }
  return frames;
}

function shadow(): Sprite {
  const b = createBuffer(30, 9);
  ellipse(b, 15, 4, 14, 4, [INK, INK, INK]);
  return finish(b, 15, 4);
}

/** Guan Yu's face for the HUD, taken straight from his head stamp. */
function portrait(): Sprite {
  const skin = SKINS.guanyu;
  const b = createBuffer(17, 14);
  stamp(b, skin.head.ax, skin.head.ay, { ...skin.head, rows: skin.head.rows.slice(0, 14) }, skin.legend);
  return finish(b, 0, 0);
}

export interface MiscSprites {
  readonly crate: Sprite;
  readonly jar: Sprite;
  readonly barrel: Sprite;
  readonly bun: Sprite;
  readonly chicken: Sprite;
  readonly gold: Sprite;
  readonly arrow: Sprite;
  readonly sparkSlash: readonly Sprite[];
  readonly sparkBlunt: readonly Sprite[];
  readonly sparkFire: readonly Sprite[];
  readonly dust: readonly Sprite[];
  readonly flame: readonly Sprite[];
  readonly flameSmall: readonly Sprite[];
  readonly shadow: Sprite;
  readonly portrait: Sprite;
}

export function buildMiscSprites(): MiscSprites {
  return {
    crate: crate(),
    jar: jar(),
    barrel: barrel(),
    bun: bun(),
    chicken: chicken(),
    gold: gold(),
    arrow: arrow(),
    sparkSlash: sparkFrames(WHITE, C.steel[2], [9, 13, 15]),
    sparkBlunt: sparkFrames(WHITE, C.gold[2], [7, 10, 12]),
    sparkFire: sparkFrames(C.fire[2], C.fire[1], [8, 11, 13]),
    dust: dustFrames(),
    flame: flameFrames(20, 30, 4),
    flameSmall: flameFrames(12, 16, 4),
    shadow: shadow(),
    portrait: portrait(),
  };
}

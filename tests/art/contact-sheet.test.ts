import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { PALETTE_RGB } from '../../src/gfx/art/palettes';
import { POSES } from '../../src/gfx/art/poses';
import { SKINS } from '../../src/gfx/art/skins';
import { bakePose, type BakedFrame } from '../../src/gfx/rig/bake';
import type { FighterKind } from '../../src/sim/types';
import { encodePng } from './png';

/**
 * Dev tool: set SHEET_DIR to write a PNG contact sheet per fighter, so sprite
 * art can be reviewed without a browser. Skipped in normal test runs.
 *   SHEET_DIR=out SHEET_SCALE=3 npx vitest run tests/art/contact-sheet.test.ts
 */
const outDir = process.env.SHEET_DIR;
const scale = Number(process.env.SHEET_SCALE ?? 3);
const only = process.env.SHEET_KIND;
const filter = process.env.SHEET_POSES?.split(',');

const CELL_W = 150;
const CELL_H = 124;
const COLUMNS = 6;
const GROUND = 112;
const CENTER = 66;
const BACKGROUND = [58, 51, 80] as const;
const FLOOR = [80, 72, 104] as const;

function blit(sheet: Uint8Array, sheetW: number, frame: BakedFrame, cx: number, groundY: number): void {
  for (let y = 0; y < frame.h; y++) {
    for (let x = 0; x < frame.w; x++) {
      const index = frame.px[y * frame.w + x];
      if (index === 0) continue;
      const rgb = PALETTE_RGB[index];
      const px = cx - frame.ax + x;
      const py = groundY - frame.ay + y;
      if (px < 0 || py < 0 || px >= sheetW) continue;
      const at = (py * sheetW + px) * 4;
      sheet[at] = rgb[0];
      sheet[at + 1] = rgb[1];
      sheet[at + 2] = rgb[2];
    }
  }
}

function upscale(src: Uint8Array, w: number, h: number, factor: number): Uint8Array {
  const out = new Uint8Array(w * factor * h * factor * 4);
  for (let y = 0; y < h * factor; y++) {
    for (let x = 0; x < w * factor; x++) {
      const from = (Math.floor(y / factor) * w + Math.floor(x / factor)) * 4;
      out.set(src.subarray(from, from + 4), (y * w * factor + x) * 4);
    }
  }
  return out;
}

function buildSheet(kind: FighterKind): { png: Buffer; ids: string[] } {
  const ids = Object.keys(POSES[kind]).filter((id) => !filter || filter.includes(id));
  const rows = Math.ceil(ids.length / COLUMNS);
  const w = CELL_W * Math.min(COLUMNS, ids.length);
  const h = CELL_H * rows;
  const sheet = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const floor = i / w - Math.floor(i / w / CELL_H) * CELL_H >= GROUND;
    sheet.set(floor ? FLOOR : BACKGROUND, i * 4);
    sheet[i * 4 + 3] = 255;
  }
  ids.forEach((id, i) => {
    const frame = bakePose(SKINS[kind], POSES[kind][id]);
    blit(sheet, w, frame, (i % COLUMNS) * CELL_W + CENTER, Math.floor(i / COLUMNS) * CELL_H + GROUND);
  });
  return { png: encodePng(w * scale, h * scale, upscale(sheet, w, h, scale)), ids };
}

describe.skipIf(!outDir)('sprite contact sheets', () => {
  test('writes one sheet per fighter kind', () => {
    const dir = outDir ?? '.';
    mkdirSync(dir, { recursive: true });
    const kinds = (Object.keys(POSES) as FighterKind[]).filter((k) => !only || k === only);
    for (const kind of kinds) {
      const { png, ids } = buildSheet(kind);
      writeFileSync(join(dir, `${kind}.png`), png);
      process.stdout.write(`${kind}: ${ids.join(' ')}\n`);
    }
    expect(kinds.length).toBeGreaterThan(0);
  });
});

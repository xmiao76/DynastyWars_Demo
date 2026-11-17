import { cjkAvailable, cjkGlyph } from './cjk-cache';
import { CELL_H, CELL_W, GLYPH_H, GLYPH_ORDER, GLYPH_W, GLYPHS, glyphKey } from './font-latin';

export type Align = 'left' | 'center' | 'right';

export interface TextStyle {
  readonly color?: string;
  /** Drop-shadow colour; null for none. */
  readonly shadow?: string | null;
  readonly scale?: number;
  readonly align?: Align;
}

export interface CjkStyle {
  readonly color?: string;
  readonly shadow?: string | null;
  /** Cell size in pixels; 16 for HUD names, larger for title cards. */
  readonly size?: number;
  readonly align?: Align;
}

const DEFAULT_COLOR = '#ffffff';
const DEFAULT_SHADOW = '#150d1c';
const DEFAULT_CJK_SIZE = 16;
const CJK_GAP = 1;

const sheets = new Map<string, HTMLCanvasElement>();

function buildSheet(color: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = GLYPH_ORDER.length * CELL_W;
  canvas.height = CELL_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.');
  ctx.fillStyle = color;
  GLYPH_ORDER.forEach((key, index) => {
    GLYPHS[key].forEach((row, y) => {
      for (let x = 0; x < GLYPH_W; x++) {
        if (row & (1 << (GLYPH_W - 1 - x))) ctx.fillRect(index * CELL_W + x, y, 1, 1);
      }
    });
  });
  return canvas;
}

function sheetFor(color: string): HTMLCanvasElement {
  let sheet = sheets.get(color);
  if (!sheet) {
    sheet = buildSheet(color);
    sheets.set(color, sheet);
  }
  return sheet;
}

function alignedX(x: number, width: number, align: Align): number {
  if (align === 'center') return Math.round(x - width / 2);
  return align === 'right' ? x - width : x;
}

export function textWidth(text: string, scale = 1): number {
  return Math.max(0, text.length * CELL_W - 1) * scale;
}

function drawRun(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, scale: number): void {
  const sheet = sheetFor(color);
  for (let i = 0; i < text.length; i++) {
    const index = GLYPH_ORDER.indexOf(glyphKey(text[i]));
    ctx.drawImage(sheet, index * CELL_W, 0, GLYPH_W, GLYPH_H, x + i * CELL_W * scale, y, GLYPH_W * scale, GLYPH_H * scale);
  }
}

/** Draw Latin text with the bitmap font. Returns the width drawn. */
export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: TextStyle = {}): number {
  const scale = style.scale ?? 1;
  const width = textWidth(text, scale);
  const left = alignedX(x, width, style.align ?? 'left');
  const shadow = style.shadow === undefined ? DEFAULT_SHADOW : style.shadow;
  if (shadow) drawRun(ctx, text, left + scale, y + scale, shadow, scale);
  drawRun(ctx, text, left, y, style.color ?? DEFAULT_COLOR, scale);
  return width;
}

export function cjkWidth(text: string, size = DEFAULT_CJK_SIZE): number {
  if (!cjkAvailable()) return 0;
  return Math.max(0, text.length * (size + CJK_GAP) - CJK_GAP);
}

/** Draw Chinese text on the pixel grid. Draws nothing (and returns 0) if no CJK font exists. */
export function drawCjk(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: CjkStyle = {}): number {
  if (!cjkAvailable()) return 0;
  const size = style.size ?? DEFAULT_CJK_SIZE;
  const width = cjkWidth(text, size);
  const left = alignedX(x, width, style.align ?? 'left');
  const shadow = style.shadow === undefined ? DEFAULT_SHADOW : style.shadow;
  const offset = size > DEFAULT_CJK_SIZE ? 2 : 1;
  [...text].forEach((ch, i) => {
    const gx = left + i * (size + CJK_GAP);
    if (shadow) ctx.drawImage(cjkGlyph(ch, size, shadow), gx + offset, y + offset);
    ctx.drawImage(cjkGlyph(ch, size, style.color ?? DEFAULT_COLOR), gx, y);
  });
  return width;
}

export interface LabelStyle {
  readonly color?: string;
  readonly zhColor?: string;
  readonly align?: Align;
  readonly gap?: number;
}

const LABEL_GAP = 4;
const LABEL_EN_DROP = 6;

/** A bilingual label: Chinese name followed by its English form, e.g. "关羽 GUAN YU". */
export function drawLabel(ctx: CanvasRenderingContext2D, zh: string, en: string, x: number, y: number, style: LabelStyle = {}): number {
  const gap = style.gap ?? LABEL_GAP;
  const zhW = cjkWidth(zh);
  const total = zhW + (zhW > 0 ? gap : 0) + textWidth(en);
  const left = alignedX(x, total, style.align ?? 'left');
  drawCjk(ctx, zh, left, y, { color: style.zhColor ?? style.color });
  drawText(ctx, en, left + zhW + (zhW > 0 ? gap : 0), y + LABEL_EN_DROP, { color: style.color });
  return total;
}

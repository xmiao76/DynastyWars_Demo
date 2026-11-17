// Dev-only contact sheet of every baked sprite frame. Not part of the production build.
import { POSES } from '../src/gfx/art/poses';
import { buildAtlas, type SpriteFrame } from '../src/gfx/rig/atlas';
import type { FighterKind } from '../src/sim/types';

const SCALES = [2, 3, 4];
const DEFAULT_SCALE = 3;

function must<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return el;
}

const atlas = buildAtlas();
const root = must<HTMLDivElement>('#root');
const kindSelect = must<HTMLSelectElement>('#kind');
const scaleSelect = must<HTMLSelectElement>('#scale');
const params = new URLSearchParams(location.search);

function fillSelect(select: HTMLSelectElement, values: readonly string[], selected: string): void {
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    option.selected = value === selected;
    select.append(option);
  }
}

function card(id: string, frame: SpriteFrame, scale: number): HTMLElement {
  const figure = document.createElement('figure');
  const canvas = document.createElement('canvas');
  canvas.width = frame.w;
  canvas.height = frame.h;
  canvas.style.width = `${frame.w * scale}px`;
  canvas.style.height = `${frame.h * scale}px`;
  canvas.getContext('2d')?.drawImage(frame.canvas, 0, 0);
  const caption = document.createElement('figcaption');
  caption.textContent = id;
  figure.append(canvas, caption);
  return figure;
}

function render(): void {
  const scale = Number(scaleSelect.value);
  const kinds = kindSelect.value === 'all' ? (Object.keys(POSES) as FighterKind[]) : [kindSelect.value as FighterKind];
  root.replaceChildren();
  for (const kind of kinds) {
    const heading = document.createElement('h2');
    heading.textContent = kind;
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    for (const [id, frame] of Object.entries(atlas[kind])) sheet.append(card(id, frame, scale));
    root.append(heading, sheet);
  }
}

fillSelect(kindSelect, ['all', ...Object.keys(POSES)], params.get('kind') ?? 'all');
fillSelect(scaleSelect, SCALES.map(String), params.get('scale') ?? String(DEFAULT_SCALE));
kindSelect.addEventListener('change', render);
scaleSelect.addEventListener('change', render);
render();

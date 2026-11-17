import { SCREEN_W } from '../../data/tuning';
import type { FxKind, SimEvent } from '../../sim/types';
import type { MiscSprites, Sprite } from './misc-sprites';
import { drawText } from './text';

/**
 * Render-side effects. This state is purely cosmetic and never feeds back
 * into the simulation, so it uses pooled mutable particles and Math.random.
 */
type ParticleKind = 'anim' | 'bit' | 'ring' | 'text';

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  gravity: number;
  life: number;
  max: number;
  frames: readonly Sprite[] | null;
  colors: readonly string[];
  size: number;
  text: string;
}

export interface FxState {
  particles: Particle[];
  shake: number;
  flash: number;
}

const SPARK_LIFE = 9;
const DUST_LIFE = 15;
const RING_LIFE = 18;
const TEXT_LIFE = 44;
const EMBER_CHANCE = 0.32;
const MAX_PARTICLES = 220;
const RING_STEPS = 28;
const FIRE_COLORS = ['#ffe060', '#f08020', '#c8301c', '#6a1420'] as const;
const WOOD_COLORS = ['#a06a3a', '#6e4226'] as const;
const STAR_COLORS = ['#ffffff', '#ffe060', '#d9a030'] as const;

export function createFx(): FxState {
  return { particles: [], shake: 0, flash: 0 };
}

function add(fx: FxState, p: Partial<Particle> & Pick<Particle, 'kind' | 'x' | 'y' | 'z' | 'life'>): void {
  if (fx.particles.length >= MAX_PARTICLES) return;
  fx.particles.push({ vx: 0, vy: 0, gravity: 0, max: p.life, frames: null, colors: STAR_COLORS, size: 1, text: '', ...p });
}

function burst(fx: FxState, x: number, y: number, z: number, count: number, colors: readonly string[], speed: number): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    add(fx, {
      kind: 'bit',
      x,
      y,
      z,
      vx: Math.cos(angle) * v,
      vy: Math.abs(Math.sin(angle)) * v + 0.6,
      gravity: 0.16,
      life: 16 + Math.floor(Math.random() * 14),
      colors,
      size: Math.random() < 0.4 ? 2 : 1,
    });
  }
}

function spawnKind(fx: FxState, sprites: MiscSprites, kind: FxKind, x: number, y: number, z: number, heavy: boolean): void {
  switch (kind) {
    case 'spark_slash':
    case 'spark_blunt':
    case 'spark_fire': {
      const frames = kind === 'spark_slash' ? sprites.sparkSlash : kind === 'spark_blunt' ? sprites.sparkBlunt : sprites.sparkFire;
      add(fx, { kind: 'anim', x, y, z: z + 1, life: SPARK_LIFE, frames });
      if (heavy) burst(fx, x, y, z, 7, kind === 'spark_fire' ? FIRE_COLORS : STAR_COLORS, 2.2);
      return;
    }
    case 'dust':
      add(fx, { kind: 'anim', x, y: 0, z: z + 1, life: DUST_LIFE, frames: sprites.dust });
      if (heavy) burst(fx, x, 2, z, 4, ['#c8c8d8', '#8a8a9c'], 1.2);
      return;
    case 'explode':
      add(fx, { kind: 'ring', x, y, z, life: RING_LIFE, size: 44, colors: FIRE_COLORS });
      burst(fx, x, y, z, 18, FIRE_COLORS, 3);
      fx.flash = Math.max(fx.flash, 3);
      return;
    case 'break':
      burst(fx, x, y, z, 9, WOOD_COLORS, 2);
      return;
    case 'pickup':
      burst(fx, x, y, z, 6, STAR_COLORS, 1.2);
      return;
    case 'ko':
      burst(fx, x, y, z, heavy ? 30 : 6, STAR_COLORS, heavy ? 3.4 : 1.8);
      if (heavy) fx.flash = Math.max(fx.flash, 8);
      return;
    case 'summon':
      add(fx, { kind: 'ring', x, y, z, life: RING_LIFE, size: 30, colors: ['#ffe060', '#e85a40', '#b02a2a'] });
      return;
    case 'special':
      add(fx, { kind: 'ring', x, y: 4, z, life: RING_LIFE, size: 60, colors: ['#ffffff', '#9fd4f0', '#5a86d8'] });
      return;
  }
}

/** Turn this tick's simulation events into particles, shake and flashes. */
export function spawnFx(fx: FxState, events: readonly SimEvent[], sprites: MiscSprites): void {
  for (const e of events) {
    if (e.t === 'fx') spawnKind(fx, sprites, e.kind, e.x, e.y, e.z, e.heavy);
    else if (e.t === 'shake') fx.shake = Math.max(fx.shake, e.power * 2);
    else if (e.t === 'score') add(fx, { kind: 'text', x: e.x, y: 30, z: e.z, vy: 0.5, life: TEXT_LIFE, text: `${e.amount}` });
  }
}

/** Embers drift up across the screen all the time: the whole fleet is on fire. */
function spawnEmber(fx: FxState, cameraX: number): void {
  if (Math.random() > EMBER_CHANCE) return;
  add(fx, {
    kind: 'bit',
    x: cameraX + Math.random() * (SCREEN_W + 60),
    y: Math.random() * 30,
    z: 130 + Math.random() * 94,
    vx: -0.25 - Math.random() * 0.4,
    vy: 0.3 + Math.random() * 0.6,
    gravity: -0.004,
    life: 90 + Math.floor(Math.random() * 80),
    colors: FIRE_COLORS,
    size: 1,
  });
}

export function updateFx(fx: FxState, cameraX: number): void {
  if (fx.shake > 0) fx.shake -= 1;
  if (fx.flash > 0) fx.flash -= 1;
  spawnEmber(fx, cameraX);
  for (const p of fx.particles) {
    p.life -= 1;
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= p.gravity;
    if (p.y < 0 && p.gravity > 0) {
      p.y = 0;
      p.vy = -p.vy * 0.4;
      p.vx *= 0.6;
    }
  }
  fx.particles = fx.particles.filter((p) => p.life > 0);
}

/** Screen offset for camera shake. */
export function shakeOffset(fx: FxState): readonly [number, number] {
  if (fx.shake <= 0) return [0, 0];
  const amp = Math.min(4, Math.ceil(fx.shake / 3));
  return [fx.shake & 1 ? amp : -amp, fx.shake & 2 ? -1 : 1];
}

function ageColor(p: Particle): string {
  const t = 1 - p.life / p.max;
  return p.colors[Math.min(p.colors.length - 1, Math.floor(t * p.colors.length))];
}

function drawRing(ctx: CanvasRenderingContext2D, p: Particle, sx: number, sy: number): void {
  const t = 1 - p.life / p.max;
  const r = p.size * (0.25 + t * 0.75);
  ctx.fillStyle = ageColor(p);
  const dot = t < 0.5 ? 2 : 1;
  for (let i = 0; i < RING_STEPS; i++) {
    const a = (i / RING_STEPS) * Math.PI * 2;
    ctx.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r * 0.45), dot, dot);
  }
}

export function drawFx(ctx: CanvasRenderingContext2D, fx: FxState, cameraX: number): void {
  const cam = Math.floor(cameraX);
  for (const p of fx.particles) {
    const sx = Math.round(p.x - cam);
    const sy = Math.round(p.z - p.y);
    if (p.kind === 'anim' && p.frames) {
      const index = Math.min(p.frames.length - 1, Math.floor(((p.max - p.life) / p.max) * p.frames.length));
      const frame = p.frames[index];
      ctx.drawImage(frame.canvas, sx - frame.ax, sy - frame.ay);
    } else if (p.kind === 'bit') {
      ctx.fillStyle = ageColor(p);
      ctx.fillRect(sx, sy, p.size, p.size);
    } else if (p.kind === 'ring') {
      drawRing(ctx, p, sx, sy);
    } else if (p.kind === 'text') {
      drawText(ctx, p.text, sx, sy, { align: 'center', color: '#ffe060' });
    }
  }
}

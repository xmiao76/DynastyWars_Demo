import { SCREEN_H, SCREEN_W } from '../../data/tuning';
import type { Fighter, Hazard, Pickup, Projectile, Prop, World } from '../../sim/types';
import { poseIdFor } from '../anim';
import { frameOf, type Atlas } from '../rig/atlas';
import type { Backdrop } from './backdrop-redcliffs';
import { drawFx, shakeOffset, type FxState } from './fx';
import type { MiscSprites, Sprite } from './misc-sprites';

export interface RenderDeps {
  readonly atlas: Atlas;
  readonly sprites: MiscSprites;
  readonly backdrop: Backdrop;
}

type Ctx = CanvasRenderingContext2D;

interface Drawable {
  readonly z: number;
  readonly draw: () => void;
}

const SHADOW_ALPHA = 0.38;
const BLINK_PERIOD = 4;
const DEAD_BLINK_PERIOD = 6;
const PICKUP_WARN_TICKS = 130;
const FLAME_FRAME_TICKS = 6;
const FLAME_SPACING = 13;
const MAST_FALL_TICKS = 26;
const MAST_FALL_SPEED = 7;
const RAIN_FALL_TICKS = 12;
const SHADOW_WIDTH: Readonly<Record<Fighter['kind'], number>> = {
  guanyu: 30,
  sword: 24,
  spear: 24,
  archer: 22,
  brute: 36,
  yujin: 32,
};

function drawShadow(ctx: Ctx, sprites: MiscSprites, sx: number, z: number, width: number, height: number): void {
  const shrink = Math.max(0.5, 1 - height / 160);
  const w = Math.round(width * shrink);
  ctx.globalAlpha = SHADOW_ALPHA;
  ctx.drawImage(sprites.shadow.canvas, sx - Math.floor(w / 2), Math.round(z) - 3, w, 7);
  ctx.globalAlpha = 1;
}

function isHidden(f: Fighter, tick: number): boolean {
  if (f.state === 'dead') return tick % DEAD_BLINK_PERIOD < DEAD_BLINK_PERIOD / 2;
  return f.invuln > 0 && f.state !== 'attack' && tick % BLINK_PERIOD < BLINK_PERIOD / 2;
}

function drawFighter(ctx: Ctx, deps: RenderDeps, f: Fighter, cam: number, tick: number): void {
  const sx = Math.round(f.x - cam);
  drawShadow(ctx, deps.sprites, sx, f.z, SHADOW_WIDTH[f.kind], f.y);
  if (isHidden(f, tick)) return;
  const frame = frameOf(deps.atlas, f.kind, poseIdFor(f));
  const image = f.flash > 0 && f.flash % 2 === 0 ? frame.white : frame.canvas;
  // Victims rattle in place during hitstop.
  const rattle = f.hitstop > 0 && (f.state === 'hurt' || f.state === 'launched') ? (f.hitstop & 1 ? 1 : -1) : 0;
  const top = Math.round(f.z - f.y) - frame.ay;
  if (f.facing === 1) {
    ctx.drawImage(image, sx + rattle - frame.ax, top);
    return;
  }
  ctx.save();
  ctx.translate(sx + rattle, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(image, -frame.ax, top);
  ctx.restore();
}

function drawSprite(ctx: Ctx, sprite: Sprite, sx: number, sy: number, flip = false): void {
  if (!flip) {
    ctx.drawImage(sprite.canvas, sx - sprite.ax, sy - sprite.ay);
    return;
  }
  ctx.save();
  ctx.translate(sx, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(sprite.canvas, -sprite.ax, sy - sprite.ay);
  ctx.restore();
}

function drawProp(ctx: Ctx, deps: RenderDeps, p: Prop, cam: number): void {
  const sx = Math.round(p.x - cam) + (p.flash > 0 ? (p.flash & 1 ? 1 : -1) : 0);
  drawShadow(ctx, deps.sprites, sx, p.z, 24, 0);
  drawSprite(ctx, deps.sprites[p.kind], sx, Math.round(p.z));
}

function drawPickup(ctx: Ctx, deps: RenderDeps, p: Pickup, cam: number, tick: number): void {
  if (p.ttl < PICKUP_WARN_TICKS && tick % BLINK_PERIOD < BLINK_PERIOD / 2) return;
  const sx = Math.round(p.x - cam);
  drawShadow(ctx, deps.sprites, sx, p.z, 16, p.y);
  drawSprite(ctx, deps.sprites[p.kind], sx, Math.round(p.z - p.y));
}

function drawArrow(ctx: Ctx, deps: RenderDeps, a: Projectile, cam: number): void {
  const sx = Math.round(a.x - cam);
  drawShadow(ctx, deps.sprites, sx, a.z, 12, a.y);
  drawSprite(ctx, deps.sprites.arrow, sx, Math.round(a.z - a.y), a.vx < 0);
}

function drawFire(ctx: Ctx, deps: RenderDeps, h: Hazard, cam: number, tick: number): void {
  const count = Math.max(1, Math.floor((h.halfW * 2) / FLAME_SPACING));
  for (let i = 0; i < count; i++) {
    const frames = i % 2 === 0 ? deps.sprites.flame : deps.sprites.flameSmall;
    const frame = frames[Math.floor((tick + i * 5) / FLAME_FRAME_TICKS) % frames.length];
    const x = h.x - h.halfW + (i + 0.5) * ((h.halfW * 2) / count);
    drawSprite(ctx, frame, Math.round(x - cam), Math.round(h.z + (i % 2 === 0 ? 2 : -2)));
  }
}

/** Ground warning for a strike that has not landed yet: a blinking shadow where it will hit. */
function drawWarning(ctx: Ctx, h: Hazard, cam: number, tick: number): void {
  if (h.kind === 'fire' || h.delay <= 0) return;
  const urgent = h.delay < 30;
  if (tick % (urgent ? 4 : 8) < (urgent ? 2 : 4)) return;
  const sx = Math.round(h.x - cam);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = h.kind === 'mast' ? '#150d1c' : '#b02a2a';
  ctx.fillRect(sx - h.halfW, Math.round(h.z - h.halfD), h.halfW * 2, h.halfD * 2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffe060';
  ctx.fillRect(sx - h.halfW, Math.round(h.z - h.halfD), h.halfW * 2, 1);
  ctx.fillRect(sx - h.halfW, Math.round(h.z + h.halfD) - 1, h.halfW * 2, 1);
}

function drawMast(ctx: Ctx, h: Hazard, cam: number): void {
  if (h.delay > MAST_FALL_TICKS) return;
  const sx = Math.round(h.x - cam);
  const y = Math.round(h.z) - 5 - h.delay * MAST_FALL_SPEED;
  ctx.fillStyle = '#241a1c';
  ctx.fillRect(sx - h.halfW, y, h.halfW * 2, 8);
  ctx.fillStyle = '#4a2a22';
  ctx.fillRect(sx - h.halfW, y, h.halfW * 2, 2);
  ctx.fillStyle = '#565a70';
  for (let x = -h.halfW + 12; x < h.halfW; x += 30) ctx.fillRect(sx + x, y, 3, 8);
}

function drawRain(ctx: Ctx, h: Hazard, cam: number): void {
  if (h.delay > RAIN_FALL_TICKS) return;
  const sx = Math.round(h.x - cam);
  for (let i = -2; i <= 2; i++) {
    const x = sx + i * 6;
    const groundY = Math.round(h.z) + (i % 2) * 3;
    const drop = h.delay * 12;
    ctx.fillStyle = '#e3ecfa';
    ctx.fillRect(x + drop / 3, groundY - 12 - drop, 1, 4);
    ctx.fillStyle = '#a06a3a';
    ctx.fillRect(x + 1 + drop / 3, groundY - 8 - drop, 1, 8);
  }
}

function collect(ctx: Ctx, deps: RenderDeps, world: World, cam: number, tick: number): Drawable[] {
  const items: Drawable[] = [];
  for (const f of world.fighters) items.push({ z: f.z, draw: () => drawFighter(ctx, deps, f, cam, tick) });
  for (const p of world.props) items.push({ z: p.z, draw: () => drawProp(ctx, deps, p, cam) });
  for (const p of world.pickups) items.push({ z: p.z, draw: () => drawPickup(ctx, deps, p, cam, tick) });
  for (const a of world.projectiles) items.push({ z: a.z, draw: () => drawArrow(ctx, deps, a, cam) });
  for (const h of world.hazards) {
    if (h.kind === 'fire') items.push({ z: h.z, draw: () => drawFire(ctx, deps, h, cam, tick) });
    else if (h.kind === 'mast') items.push({ z: h.z, draw: () => drawMast(ctx, h, cam) });
    else items.push({ z: h.z, draw: () => drawRain(ctx, h, cam) });
  }
  return items.sort((a, b) => a.z - b.z);
}

/** Draw one frame of the fight: backdrop, ground warnings, depth-sorted actors, then effects. */
export function drawWorld(ctx: Ctx, world: World, deps: RenderDeps, fx: FxState, tick: number): void {
  const cam = Math.floor(world.cameraX);
  const [shakeX, shakeY] = shakeOffset(fx);
  ctx.save();
  ctx.translate(shakeX, shakeY);
  deps.backdrop.draw(ctx, world.cameraX, tick);
  for (const h of world.hazards) drawWarning(ctx, h, cam, tick);
  for (const item of collect(ctx, deps, world, cam, tick)) item.draw();
  drawFx(ctx, fx, world.cameraX);
  ctx.restore();
  if (fx.flash > 0) {
    ctx.globalAlpha = Math.min(0.8, fx.flash * 0.14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;
  }
}

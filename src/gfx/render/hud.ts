import { FIGHTERS } from '../../data/fighters';
import type { FighterKind, SimEvent, World } from '../../sim/types';
import type { MiscSprites } from './misc-sprites';
import { drawLabel, drawText } from './text';

type Ctx = CanvasRenderingContext2D;

/** HUD-only memory: which enemy was hit last, and a lagging copy of the player's health. */
export interface HudState {
  enemyId: number;
  enemyTicks: number;
  enemyKind: FighterKind | null;
  enemyHp: number;
  shownHp: number;
}

const ENEMY_BAR_TICKS = 170;
const LAG_SPEED = 0.5;
const PLAYER_BAR_W = 104;
const ENEMY_BAR_W = 72;
const BOSS_BAR_W = 128;
const SCORE_DIGITS = 7;
const GO_BLINK = 20;
const INK = '#150d1c';
const GOLD = '#ffe060';

export function createHud(): HudState {
  return { enemyId: 0, enemyTicks: 0, enemyKind: null, enemyHp: 0, shownHp: FIGHTERS.guanyu.maxHp };
}

export function updateHud(hud: HudState, world: World, events: readonly SimEvent[]): void {
  for (const e of events) {
    if (e.t !== 'enemyHit') continue;
    hud.enemyId = e.id;
    hud.enemyTicks = ENEMY_BAR_TICKS;
  }
  const boss = world.fighters.find((f) => FIGHTERS[f.kind].ai?.type === 'boss' && f.hp > 0);
  const target = boss ?? world.fighters.find((f) => f.id === hud.enemyId);
  if (boss) hud.enemyTicks = ENEMY_BAR_TICKS;
  else if (hud.enemyTicks > 0) hud.enemyTicks -= 1;
  if (target) hud.enemyKind = target.kind;
  hud.enemyHp = target ? target.hp : 0;
  const player = world.fighters.find((f) => f.id === world.player.id);
  const hp = player?.hp ?? 0;
  hud.shownHp = hud.shownHp > hp ? Math.max(hp, hud.shownHp - LAG_SPEED) : hp;
}

function bar(ctx: Ctx, x: number, y: number, w: number, h: number, frac: number, lag: number, color: string, light: string): void {
  ctx.fillStyle = INK;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#5a1420';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#e85a40';
  ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, lag))), h);
  const fillW = Math.round(w * Math.max(0, Math.min(1, frac)));
  ctx.fillStyle = color;
  ctx.fillRect(x, y, fillW, h);
  ctx.fillStyle = light;
  ctx.fillRect(x, y, fillW, 1);
}

function drawPlayer(ctx: Ctx, world: World, hud: HudState, sprites: MiscSprites): void {
  const def = FIGHTERS.guanyu;
  const player = world.fighters.find((f) => f.id === world.player.id);
  ctx.fillStyle = INK;
  ctx.fillRect(3, 3, 30, 26);
  ctx.fillStyle = '#d9a030';
  ctx.fillRect(4, 4, 28, 24);
  ctx.fillStyle = '#24734a';
  ctx.fillRect(5, 5, 26, 22);
  ctx.drawImage(sprites.portrait.canvas, 2, 1, 13, 11, 5, 5, 26, 22);
  drawLabel(ctx, def.nameZh, def.nameEn, 36, 2, { color: '#ffffff', zhColor: GOLD });
  bar(ctx, 36, 21, PLAYER_BAR_W, 6, (player?.hp ?? 0) / def.maxHp, hud.shownHp / def.maxHp, '#f0c020', '#fff0a0');
  drawText(ctx, `♥x${Math.max(0, world.player.lives - 1)}`, 36 + PLAYER_BAR_W + 5, 20, { color: '#ff8a70' });
}

function drawScore(ctx: Ctx, world: World): void {
  drawText(ctx, 'SCORE', 216, 3, { align: 'center', color: GOLD });
  drawText(ctx, String(world.player.score).padStart(SCORE_DIGITS, '0'), 216, 12, { align: 'center' });
}

function drawEnemy(ctx: Ctx, hud: HudState): void {
  if (hud.enemyTicks <= 0 || !hud.enemyKind) return;
  const def = FIGHTERS[hud.enemyKind];
  const isBoss = def.ai?.type === 'boss';
  const w = isBoss ? BOSS_BAR_W : ENEMY_BAR_W;
  drawLabel(ctx, def.nameZh, def.nameEn, 380, 2, { align: 'right', color: '#ffffff', zhColor: isBoss ? '#ff8a70' : '#c8c8d8' });
  const frac = hud.enemyHp / def.maxHp;
  bar(ctx, 380 - w, 21, w, isBoss ? 6 : 4, frac, frac, isBoss ? '#c060e0' : '#5aa0f0', isBoss ? '#f0c0ff' : '#c0e0ff');
}

function drawGo(ctx: Ctx, world: World, tick: number): void {
  if (world.stage.goTicks <= 0 || tick % GO_BLINK >= GO_BLINK / 2) return;
  drawText(ctx, 'GO →', 376, 86, { align: 'right', scale: 2, color: GOLD });
}

export function drawHud(ctx: Ctx, world: World, hud: HudState, sprites: MiscSprites, tick: number): void {
  drawPlayer(ctx, world, hud, sprites);
  drawScore(ctx, world);
  drawEnemy(ctx, hud);
  drawGo(ctx, world, tick);
}

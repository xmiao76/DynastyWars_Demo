import { SCREEN_W } from '../../src/data/tuning';
import { step } from '../../src/sim/step';
import { BTN, type Fighter, type World } from '../../src/sim/types';

const ATTACK_PULSE = 6;
const REACH = 40;
const LINE_UP_TOLERANCE = 3;
const STRIKE_DEPTH = 8;
const CROWD_RADIUS = 46;
const CROWD_DEPTH = 14;
const CROWD_SIZE = 3;
const SPECIAL_MIN_HP = 30;
const VIEW_MARGIN = 10;

function nearest(p: Fighter, enemies: readonly Fighter[]): Fighter {
  let best = enemies[0];
  let bestDist = Infinity;
  for (const e of enemies) {
    const dist = Math.abs(e.x - p.x) + Math.abs(e.z - p.z) * 2;
    if (dist < bestDist) {
      best = e;
      bestDist = dist;
    }
  }
  return best;
}

function isCrowded(p: Fighter, enemies: readonly Fighter[]): boolean {
  const close = enemies.filter((e) => Math.abs(e.x - p.x) < CROWD_RADIUS && Math.abs(e.z - p.z) < CROWD_DEPTH);
  return close.length >= CROWD_SIZE && p.hp > SPECIAL_MIN_HP;
}

/**
 * A simple test-only player: walk right when the way is clear, otherwise line
 * up with the nearest enemy and mash attack, using the special when mobbed.
 */
export function botButtons(w: World): number {
  if (w.phase === 'continue') return w.tick % 2 === 0 ? BTN.START : 0;
  const p = w.fighters.find((f) => f.id === w.player.id);
  if (!p) return 0;
  const pulse = w.tick % ATTACK_PULSE < ATTACK_PULSE / 2;
  const enemies = w.fighters.filter((f) => f.team === 'enemy' && f.hp > 0);
  if (enemies.length === 0) return BTN.RIGHT;
  const visible = enemies.filter((e) => e.x > w.cameraX - VIEW_MARGIN && e.x < w.cameraX + SCREEN_W + VIEW_MARGIN);
  if (visible.length === 0) return 0;
  if (isCrowded(p, visible)) return pulse ? BTN.ATTACK | BTN.JUMP : 0;
  const target = nearest(p, visible);
  const dx = target.x - p.x;
  const dz = target.z - p.z;
  let buttons = 0;
  if (Math.abs(dz) > LINE_UP_TOLERANCE) buttons |= dz > 0 ? BTN.DOWN : BTN.UP;
  if (Math.abs(dx) > REACH) return buttons | (dx > 0 ? BTN.RIGHT : BTN.LEFT);
  if (Math.abs(dz) > STRIKE_DEPTH) return buttons;
  if (dx !== 0 && Math.sign(dx) !== p.facing) buttons |= dx > 0 ? BTN.RIGHT : BTN.LEFT;
  return pulse ? buttons | BTN.ATTACK : buttons;
}

export interface RunResult {
  readonly world: World;
  readonly ticks: number;
}

/** Run the bot until the game leaves the given set of phases or the tick budget runs out. */
export function runBot(start: World, maxTicks: number, until: (w: World) => boolean): RunResult {
  let world = start;
  let ticks = 0;
  while (ticks < maxTicks && !until(world)) {
    world = step(world, botButtons(world)).world;
    ticks += 1;
  }
  return { world, ticks };
}

export function describe(w: World): string {
  const enemies = w.fighters
    .filter((f) => f.team === 'enemy')
    .map((f) => `${f.kind}@${Math.round(f.x)},${Math.round(f.z)} hp${f.hp} ${f.state}`)
    .join(' | ');
  const p = w.fighters.find((f) => f.id === w.player.id);
  const player = p ? `player@${Math.round(p.x)},${Math.round(p.z)} hp${p.hp} ${p.state}` : 'no player';
  return `tick ${w.tick} phase ${w.phase} section ${w.stage.section} active ${w.stage.active} wave ${w.stage.wave} cam ${Math.round(w.cameraX)} lives ${w.player.lives} :: ${player} :: ${enemies}`;
}

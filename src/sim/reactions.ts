import { FIGHTERS } from '../data/fighters';
import { FLASH_TICKS, KO_LAUNCH_VX, MIN_KO_LAUNCH_VY } from '../data/tuning';
import type { Draft, FighterData } from './types';
import { emit, findFighter, fx, setState, sfx } from './world';

const MIN_LAUNCH_VY = 2;
const BOSS_KO_SHAKE = 8;

/** Undo a grab from either side, freeing both fighters. */
export function breakLink(d: Draft, f: FighterData): void {
  if (!f.link) return;
  const other = findFighter(d, f.link);
  f.link = 0;
  if (!other || other.link !== f.id) return;
  other.link = 0;
  if (other.state === 'grabbed' || other.state === 'grabbing') setState(other, 'idle');
}

/** Send a fighter flying; it will land on its back. */
export function launch(d: Draft, v: FighterData, vx: number, vy: number): void {
  breakLink(d, v);
  setState(v, 'launched');
  v.vx = vx;
  v.vy = Math.max(vy, MIN_LAUNCH_VY);
  v.vz = 0;
  v.bounced = false;
}

/** Brief stagger in place. */
export function stagger(d: Draft, v: FighterData, stun: number, vx: number): void {
  breakLink(d, v);
  setState(v, 'hurt');
  v.stun = stun;
  v.vx = vx;
  v.vz = 0;
}

export function applyDamage(v: FighterData, amount: number): void {
  v.hp = Math.max(0, v.hp - amount);
  v.flash = FLASH_TICKS;
}

function fellEveryoneElse(d: Draft, boss: FighterData): void {
  for (const other of d.fighters) {
    if (other.team !== boss.team || other.id === boss.id || other.hp <= 0) continue;
    other.hp = 0;
    launch(d, other, other.x < boss.x ? -KO_LAUNCH_VX : KO_LAUNCH_VX, MIN_KO_LAUNCH_VY);
  }
}

/** Bookkeeping for a fighter whose health just reached zero. */
export function knockOut(d: Draft, v: FighterData): void {
  const def = FIGHTERS[v.kind];
  if (v.team === 'player') {
    emit(d, { t: 'playerDeath' });
    sfx(d, 'player_death');
    return;
  }
  d.player.score += def.score;
  d.player.kos += 1;
  emit(d, { t: 'score', amount: def.score, x: v.x, z: v.z });
  fx(d, 'ko', v.x, v.y + def.chestHeight, v.z, def.ai?.type === 'boss');
  if (def.ai?.type !== 'boss') {
    sfx(d, 'ko');
    return;
  }
  sfx(d, 'boss_ko');
  emit(d, { t: 'bossDown' });
  emit(d, { t: 'shake', power: BOSS_KO_SHAKE });
  fellEveryoneElse(d, v);
}

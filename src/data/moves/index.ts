import type { MoveDef, MoveId } from '../../sim/types';
import { ENEMY_MOVES } from './enemies';
import { GUANYU_MOVES } from './guanyu';
import { YUJIN_MOVES } from './yujin';

const ALL_MOVES: readonly MoveDef[] = [...GUANYU_MOVES, ...ENEMY_MOVES, ...YUJIN_MOVES];

export const MOVES: Readonly<Record<MoveId, MoveDef>> = Object.fromEntries(
  ALL_MOVES.map((move) => [move.id, move]),
);

/** Look up a move, failing loudly on a typo rather than silently doing nothing. */
export function getMove(id: MoveId): MoveDef {
  const move = MOVES[id];
  if (!move) throw new Error(`Unknown move id: ${id}`);
  return move;
}

export function allMoves(): readonly MoveDef[] {
  return ALL_MOVES;
}

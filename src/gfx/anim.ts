import { currentFrame } from '../sim/fighter-moves';
import type { Fighter, PoseId } from '../sim/types';

const IDLE_FRAME_TICKS = 32;
const WALK_FRAME_TICKS = 8;
const DASH_FRAME_TICKS = 5;
const WALK_CYCLE: readonly PoseId[] = ['walk0', 'walk1', 'walk2', 'walk3'];

function cycle(frames: readonly PoseId[], ticks: number, frameTicks: number): PoseId {
  return frames[Math.floor(ticks / frameTicks) % frames.length];
}

/** Which baked pose a fighter shows right now. Purely a function of its simulation state. */
export function poseIdFor(f: Fighter): PoseId {
  switch (f.state) {
    case 'attack':
      return currentFrame(f)?.pose ?? 'idle0';
    case 'idle':
      return cycle(['idle0', 'idle1'], f.stateTicks, IDLE_FRAME_TICKS);
    case 'walk':
      return cycle(WALK_CYCLE, f.stateTicks, WALK_FRAME_TICKS);
    case 'dash':
      return cycle(['dash0', 'dash1'], f.stateTicks, DASH_FRAME_TICKS);
    case 'air':
      return f.vy > 0 ? 'jump_up' : 'jump_down';
    case 'hurt':
    case 'grabbed':
      return 'hurt';
    case 'launched':
    case 'thrown':
      return 'fall';
    case 'down':
    case 'dead':
      return 'down';
    case 'getup':
      return 'getup';
    case 'grabbing':
      return 'hold';
  }
}

import type { SectionDef, StageDef } from '../data/stages/types';
import { GO_PROMPT_TICKS, WAVE_GAP_TICKS } from '../data/tuning';
import { addHazard, spawnEnemy } from './spawn';
import type { Draft, StageProgress } from './types';
import { emit, sfx } from './world';

const LOCK_TOLERANCE = 0.5;

export function livingEnemies(d: Draft): number {
  return d.fighters.filter((f) => f.team === 'enemy' && f.hp > 0).length;
}

function activate(d: Draft, section: SectionDef, s: StageProgress): void {
  s.active = true;
  s.wave = 0;
  s.waveTicks = 0;
  s.spawned = 0;
  s.gap = 0;
  s.goTicks = 0;
  for (const hazard of section.hazards ?? []) addHazard(d, hazard);
  emit(d, { t: 'section', index: s.section, boss: section.boss === true });
}

function finishSection(d: Draft, stage: StageDef, s: StageProgress): void {
  s.active = false;
  s.section += 1;
  if (s.section >= stage.sections.length) {
    s.cleared = true;
    return;
  }
  s.goTicks = GO_PROMPT_TICKS;
  emit(d, { t: 'go' });
  sfx(d, 'go');
}

function runWaves(d: Draft, stage: StageDef, section: SectionDef, s: StageProgress): void {
  const wave = section.waves[s.wave];
  while (s.spawned < wave.spawns.length && wave.spawns[s.spawned].delay <= s.waveTicks) {
    const def = wave.spawns[s.spawned];
    spawnEnemy(d, def.kind, def.side, def.z);
    s.spawned += 1;
  }
  s.waveTicks += 1;
  if (s.spawned < wave.spawns.length || livingEnemies(d) > 0) return;
  if (s.wave + 1 >= section.waves.length) {
    finishSection(d, stage, s);
    return;
  }
  s.gap += 1;
  if (s.gap < WAVE_GAP_TICKS) return;
  s.wave += 1;
  s.waveTicks = 0;
  s.spawned = 0;
  s.gap = 0;
}

/** Lock the screen when a section is reached, feed its waves in, and open the way on when it is cleared. */
export function updateStage(d: Draft, stage: StageDef): void {
  const s = d.stage;
  if (s.cleared) return;
  const section = stage.sections[s.section];
  if (s.active) {
    runWaves(d, stage, section, s);
    return;
  }
  if (s.goTicks > 0) s.goTicks -= 1;
  if (d.cameraX >= section.lockX - LOCK_TOLERANCE) activate(d, section, s);
}

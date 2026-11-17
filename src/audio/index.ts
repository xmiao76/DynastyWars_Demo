import type { SfxId, SongId } from '../data/audio-ids';

export interface AudioEngine {
  /** Create or resume the AudioContext. Safe to call on every user gesture. */
  unlock(): void;
  playSfx(id: SfxId): void;
  /** 'title' | 'stage' | 'boss' loop; 'clear' | 'gameover' play once. null stops music. Asking for the song that is already playing is a no-op. */
  playSong(id: SongId | null): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  /** Suspend or resume all audio (tab hidden, game paused). */
  setSuspended(suspended: boolean): void;
}

export { createAudioEngine } from './engine';

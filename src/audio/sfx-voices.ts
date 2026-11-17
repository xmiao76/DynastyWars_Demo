/**
 * Pure bookkeeping for sound-effect voices: a cap on how many play at once
 * (the oldest is stolen) and a per-effect retrigger limit so that hits landing
 * on the same frame do not stack into one loud blast.
 */

export const MAX_VOICES = 8;
/** Minimum seconds between two starts of the same effect. */
export const MIN_RETRIGGER_S = 0.04;

export interface Voice<Handle> {
  /** Whatever the caller needs in order to silence the voice early. */
  readonly handle: Handle;
  /** Clock time at which the voice ends by itself. */
  readonly endTime: number;
}

export interface VoiceLedger<Handle> {
  /** Voices in start order, oldest first. */
  readonly voices: readonly Voice<Handle>[];
  readonly lastStart: Readonly<Partial<Record<string, number>>>;
}

export interface Admission<Handle> {
  /** False when the effect was started too recently and must be skipped. */
  readonly allowed: boolean;
  /** Voices the caller must silence to stay under the cap. */
  readonly stolen: readonly Handle[];
  readonly ledger: VoiceLedger<Handle>;
}

export function emptyLedger<Handle>(): VoiceLedger<Handle> {
  return { voices: [], lastStart: {} };
}

/** Decide whether effect `key` may start at clock time `now`. */
export function admit<Handle>(
  ledger: VoiceLedger<Handle>,
  key: string,
  now: number,
): Admission<Handle> {
  const live = ledger.voices.filter((voice) => voice.endTime > now);
  const last = ledger.lastStart[key];
  if (last !== undefined && now - last < MIN_RETRIGGER_S) {
    return { allowed: false, stolen: [], ledger: { ...ledger, voices: live } };
  }
  const excess = Math.max(0, live.length - (MAX_VOICES - 1));
  return {
    allowed: true,
    stolen: live.slice(0, excess).map((voice) => voice.handle),
    ledger: { voices: live.slice(excess), lastStart: { ...ledger.lastStart, [key]: now } },
  };
}

/** Record a voice that has just started. */
export function withVoice<Handle>(
  ledger: VoiceLedger<Handle>,
  voice: Voice<Handle>,
): VoiceLedger<Handle> {
  return { ...ledger, voices: [...ledger.voices, voice] };
}

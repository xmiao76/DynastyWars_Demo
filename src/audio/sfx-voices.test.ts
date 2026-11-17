import { describe, expect, test } from 'vitest';
import {
  MAX_VOICES,
  MIN_RETRIGGER_S,
  admit,
  emptyLedger,
  withVoice,
  type VoiceLedger,
} from './sfx-voices';

/** Start `count` distinct effects 0.1 s apart, each lasting `seconds`. */
function ledgerWith(count: number, seconds: number): VoiceLedger<string> {
  let ledger = emptyLedger<string>();
  for (let i = 0; i < count; i += 1) {
    const now = i * 0.1;
    ledger = withVoice(admit(ledger, `sfx${i}`, now).ledger, {
      handle: `voice${i}`,
      endTime: now + seconds,
    });
  }
  return ledger;
}

describe('admit', () => {
  test('allows the first start of an effect', () => {
    const admission = admit(emptyLedger<string>(), 'hit_light', 1);

    expect(admission.allowed).toBe(true);
    expect(admission.stolen).toEqual([]);
  });

  test('rejects the same effect again inside the retrigger window', () => {
    // Arrange
    const first = admit(emptyLedger<string>(), 'hit_light', 1);

    // Act
    const second = admit(first.ledger, 'hit_light', 1 + MIN_RETRIGGER_S / 2);

    // Assert
    expect(second.allowed).toBe(false);
  });

  test('allows the same effect once the retrigger window has passed', () => {
    const first = admit(emptyLedger<string>(), 'hit_light', 1);

    const later = admit(first.ledger, 'hit_light', 1 + MIN_RETRIGGER_S + 0.001);

    expect(later.allowed).toBe(true);
  });

  test('a rejected start does not extend the retrigger window', () => {
    const first = admit(emptyLedger<string>(), 'hit_light', 1);
    const rejected = admit(first.ledger, 'hit_light', 1 + MIN_RETRIGGER_S * 0.9);

    const later = admit(rejected.ledger, 'hit_light', 1 + MIN_RETRIGGER_S * 1.1);

    expect(rejected.allowed).toBe(false);
    expect(later.allowed).toBe(true);
  });

  test('limits each effect separately, so different effects may start together', () => {
    const first = admit(emptyLedger<string>(), 'hit_light', 1);

    const other = admit(first.ledger, 'hit_heavy', 1);

    expect(other.allowed).toBe(true);
  });

  test('steals the oldest voice when the cap is reached', () => {
    const full = ledgerWith(MAX_VOICES, 10);

    const admission = admit(full, 'explode', 1);

    expect(admission.allowed).toBe(true);
    expect(admission.stolen).toEqual(['voice0']);
    expect(admission.ledger.voices).toHaveLength(MAX_VOICES - 1);
  });

  test('never tracks more than the cap, however many effects start', () => {
    const crowded = ledgerWith(MAX_VOICES * 3, 10);

    expect(crowded.voices).toHaveLength(MAX_VOICES);
    expect(crowded.voices[0].handle).toBe(`voice${MAX_VOICES * 2}`);
  });

  test('forgets voices that have already ended instead of stealing them', () => {
    const full = ledgerWith(MAX_VOICES, 0.05);

    const admission = admit(full, 'explode', 5);

    expect(admission.stolen).toEqual([]);
    expect(admission.ledger.voices).toEqual([]);
  });

  test('returns a new ledger and leaves the old one untouched', () => {
    const before = emptyLedger<string>();

    const admission = admit(before, 'jump', 2);

    expect(admission.ledger).not.toBe(before);
    expect(before).toEqual({ voices: [], lastStart: {} });
  });
});

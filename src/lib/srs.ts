import type { SRSRecord } from '../content/schema';
import { todayISO } from './storage';

const INTERVALS = [1, 3, 7, 14, 28];

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createSRSRecord(wordId: string): SRSRecord {
  return {
    wordId,
    ease: 2.5,
    intervalDays: 0,
    nextReview: todayISO(),
    lapses: 0,
    repetitions: 0,
  };
}

export function getDueReviews(
  srs: Record<string, SRSRecord>,
  limit = 8,
): SRSRecord[] {
  const today = todayISO();
  return Object.values(srs)
    .filter((r) => r.nextReview <= today)
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview))
    .slice(0, limit);
}

export function recordReview(
  record: SRSRecord,
  correct: boolean,
): SRSRecord {
  const updated = { ...record };

  if (correct) {
    updated.repetitions += 1;
    const idx = Math.min(updated.repetitions - 1, INTERVALS.length - 1);
    updated.intervalDays = INTERVALS[idx];
    updated.nextReview = addDays(todayISO(), updated.intervalDays);
    updated.ease = Math.min(updated.ease + 0.1, 3.0);
  } else {
    updated.lapses += 1;
    updated.repetitions = 0;
    updated.intervalDays = 1;
    updated.nextReview = addDays(todayISO(), 1);
    updated.ease = Math.max(updated.ease - 0.2, 1.3);
  }

  return updated;
}

export function enrollNewWords(
  srs: Record<string, SRSRecord>,
  wordIds: string[],
): Record<string, SRSRecord> {
  const next = { ...srs };
  for (const wordId of wordIds) {
    if (!next[wordId]) {
      next[wordId] = createSRSRecord(wordId);
    }
  }
  return next;
}

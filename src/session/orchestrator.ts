import type { DayPlan, Exercise, SessionBlock, SessionStats, Word, WordOrderExercise } from '../content/schema';
import type { PersistedState } from '../content/schema';
import { expandWordOrderExercise, dedupeWordOrderExercises } from '../lib/word-order';
import { enrollNewWords, recordReview } from '../lib/srs';
import { isToday, isYesterday, saveState, todayISO } from '../lib/storage';

export type QueuedExercise = {
  exercise: Exercise;
  block: SessionBlock;
  words?: Word[];
  word?: Word;
  isRetry?: boolean;
};

function exercisesByType(exercises: Exercise[], types: Exercise['type'][]): Exercise[] {
  return exercises.filter((e) => types.includes(e.type));
}

export function buildSessionQueue(dayPlan: DayPlan): QueuedExercise[] {
  const queue: QueuedExercise[] = [];
  const wordMap = new Map(dayPlan.words.map((w) => [w.id, w]));

  queue.push({
    exercise: {
      id: `d${String(dayPlan.day).padStart(2, '0')}-word-table`,
      type: 'wordTable',
      prompt: dayPlan.theme,
    },
    block: 'intro',
    words: dayPlan.words,
  });

  queue.push({
    exercise: {
      id: `d${String(dayPlan.day).padStart(2, '0')}-flashcards`,
      type: 'flashcardDeck',
      prompt: 'Flip each card to learn the meaning',
    },
    block: 'flashcards',
    words: dayPlan.words,
  });

  const wordOrders = exercisesByType(dayPlan.exercises, ['wordOrder']) as WordOrderExercise[];
  let sequenceIndex = 0;
  const listeningExpanded = dedupeWordOrderExercises(
    wordOrders.flatMap((ex) => expandWordOrderExercise(ex, dayPlan.words, sequenceIndex++)),
  );
  const listening = listeningExpanded.map((expanded) => ({
    exercise: expanded,
    block: 'listening' as SessionBlock,
    word: expanded.wordId ? wordMap.get(expanded.wordId) : undefined,
    words: dayPlan.words,
  }));
  queue.push(...listening);

  const pictures = exercisesByType(dayPlan.exercises, ['pictureMatch']).map((ex) => ({
    exercise: ex,
    block: 'pictures' as SessionBlock,
    word: ex.wordId ? wordMap.get(ex.wordId) : undefined,
  }));
  queue.push(...pictures);

  return queue;
}

export function getNextAvailableDay(state: PersistedState): number | null {
  const isIncomplete = (day: number): boolean =>
    state.planDays[day]?.status !== 'completed';

  for (const day of state.planOrder) {
    if (isIncomplete(day) && state.planDays[day]?.status === 'in_progress') {
      return day;
    }
  }

  for (const day of state.planOrder) {
    if (isIncomplete(day) && state.planDays[day]?.pinned) {
      return day;
    }
  }

  for (const day of state.planOrder) {
    if (isIncomplete(day)) {
      return day;
    }
  }

  return null;
}

/** Plan list order — current lesson first, then pinned, then the rest */
export function getPlanDisplayOrder(state: PersistedState): number[] {
  const { current, starred, pool } = getPlanSections(state);
  return [...(current != null ? [current] : []), ...starred, ...pool];
}

export type PlanSections = {
  current: number | null;
  starred: number[];
  pool: number[];
  past: number[];
};

export function getPlanSections(state: PersistedState): PlanSections {
  const current = getNextAvailableDay(state);
  const rest = state.planOrder.filter((d) => d !== current);
  const isCompleted = (d: number): boolean => state.planDays[d]?.status === 'completed';
  const starred = rest.filter((d) => state.planDays[d]?.pinned && !isCompleted(d));
  const pool = rest.filter((d) => !state.planDays[d]?.pinned && !isCompleted(d));
  const past = rest.filter((d) => isCompleted(d));
  return { current, starred, pool, past };
}

export function completeDay(state: PersistedState, day: number, wordIds: string[]): PersistedState {
  const next = { ...state };
  next.srs = enrollNewWords(next.srs, wordIds);
  next.completedDays = [...new Set([...next.completedDays, day])];

  const prev = next.planDays[day];
  next.planDays = {
    ...next.planDays,
    [day]: { day: prev.day, pinned: prev.pinned, status: 'completed' },
  };

  const today = todayISO();
  if (!next.completionDates.includes(today)) {
    next.completionDates = [...next.completionDates, today];
  }

  if (!isToday(next.lastStudyDate)) {
    if (isYesterday(next.lastStudyDate)) {
      next.streak += 1;
    } else {
      next.streak = 1;
    }
    next.lastStudyDate = today;
  }

  next.currentDay = null;
  saveState(next);
  return next;
}

export function updateSRSAfterAnswer(
  state: PersistedState,
  wordId: string | undefined,
  correct: boolean,
): PersistedState {
  if (!wordId || !state.srs[wordId]) return state;
  const next = { ...state, srs: { ...state.srs } };
  next.srs[wordId] = recordReview(next.srs[wordId], correct);
  saveState(next);
  return next;
}

export function createEmptyStats(): SessionStats {
  return {
    newWords: 0,
    exercisesCompleted: 0,
    exercisesCorrect: 0,
  };
}

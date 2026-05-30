import type { DayPlan, Exercise, SessionBlock, SessionStats, Word } from '../content/schema';
import type { PersistedState } from '../content/schema';
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
      prompt: "Today's vocabulary",
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

  const listening = exercisesByType(dayPlan.exercises, ['wordOrder']).map((ex) => ({
    exercise: ex,
    block: 'listening' as SessionBlock,
    word: ex.wordId ? wordMap.get(ex.wordId) : undefined,
  }));
  queue.push(...listening);

  queue.push({
    exercise: {
      id: `d${String(dayPlan.day).padStart(2, '0')}-picture-gallery`,
      type: 'pictureGallery',
      prompt: "Picture review — today's words",
    },
    block: 'pictures',
    words: dayPlan.words,
  });

  const pictures = exercisesByType(dayPlan.exercises, ['pictureMatch']).map((ex) => ({
    exercise: ex,
    block: 'pictures' as SessionBlock,
    word: ex.wordId ? wordMap.get(ex.wordId) : undefined,
  }));
  queue.push(...pictures);

  return queue;
}

export function getNextAvailableDay(state: PersistedState): number | null {
  for (const day of state.planOrder) {
    const entry = state.planDays[day];
    if (entry && (entry.status === 'available' || entry.status === 'in_progress')) {
      return day;
    }
  }
  return state.planOrder.find((d) => state.planDays[d]?.status !== 'completed') ?? null;
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

  const idx = next.planOrder.indexOf(day);
  if (idx >= 0 && idx < next.planOrder.length - 1) {
    const nextDay = next.planOrder[idx + 1];
    const nextEntry = next.planDays[nextDay];
    if (nextEntry.status === 'locked') {
      next.planDays = {
        ...next.planDays,
        [nextDay]: { ...nextEntry, status: 'available' },
      };
    }
  }

  const today = todayISO();
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

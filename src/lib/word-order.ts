import type { Word, WordOrderExercise, WordOrderDirection } from '../content/schema';
import { tokenizeEn, tokenizeRu } from './tokenize';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]!;
  }
  return copy;
}

function distractorWords(words: Word[], wordId: string | undefined, field: 'ru' | 'en'): string[] {
  return shuffle(words.filter((w) => w.id !== wordId).map((w) => w[field])).slice(
    0,
    Math.min(3, Math.max(0, words.length - 1)),
  );
}

function buildWordOrderVariant(
  base: WordOrderExercise,
  direction: WordOrderDirection,
  tokens: string[],
  pool: string[],
  idSuffix: string,
  prompt: string,
  audio: string,
): WordOrderExercise {
  return {
    ...base,
    id: `${base.id}-${idSuffix}`,
    direction,
    prompt,
    tokens,
    pool: shuffle(pool),
    audio,
  };
}

export function wordOrderSentenceKey(exercise: WordOrderExercise): string {
  return `${exercise.sentence}|${exercise.sentenceEn ?? ''}`;
}

/** Pick one direction per phrase — alternates ru→en and en→ru across the session. */
export function expandWordOrderExercise(
  exercise: WordOrderExercise,
  words: Word[],
  sequenceIndex = 0,
): WordOrderExercise[] {
  if (exercise.direction) return [exercise];

  const word = words.find((w) => w.id === exercise.wordId);
  const ruTokens = exercise.tokens.length > 0 ? exercise.tokens : tokenizeRu(exercise.sentence);
  const enTokens = tokenizeEn(exercise.sentenceEn ?? '');
  const ruAudio = exercise.audio || word?.audio || '';

  const ruToEn =
    enTokens.length >= 2
      ? buildWordOrderVariant(
          exercise,
          'ru-to-en',
          enTokens,
          [...enTokens, ...distractorWords(words, exercise.wordId, 'en')],
          'ru-en',
          'Listen in Russian, then tap the English words in order',
          ruAudio,
        )
      : null;

  const enToRu =
    ruTokens.length >= 2
      ? buildWordOrderVariant(
          exercise,
          'en-to-ru',
          ruTokens,
          [...ruTokens, ...distractorWords(words, exercise.wordId, 'ru')],
          'en-ru',
          'Listen in English, then tap the Russian words in order',
          '',
        )
      : null;

  const preferRuToEn = sequenceIndex % 2 === 0;

  if (preferRuToEn) {
    if (ruToEn) return [ruToEn];
    if (enToRu) return [enToRu];
  } else {
    if (enToRu) return [enToRu];
    if (ruToEn) return [ruToEn];
  }

  return [exercise];
}

export function dedupeWordOrderExercises(exercises: WordOrderExercise[]): WordOrderExercise[] {
  const seen = new Set<string>();
  const unique: WordOrderExercise[] = [];

  for (const exercise of exercises) {
    const key = wordOrderSentenceKey(exercise);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(exercise);
  }

  return unique;
}

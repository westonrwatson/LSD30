export type Sentence = {
  ru: string;
  en: string;
  blank?: string;
};

export type Word = {
  id: string;
  ru: string;
  en: string;
  stress?: string;
  audio: string;
  image: string;
  imageCredit?: string;
  sentences: Sentence[];
};

export type ExerciseBase = {
  id: string;
  wordId?: string;
  prompt: string;
  promptEn?: string;
};

export type McqExercise = ExerciseBase & {
  type: 'mcq';
  options: string[];
  correctIndex: number;
};

export type FillBlankExercise = ExerciseBase & {
  type: 'fillBlank';
  sentence: string;
  sentenceEn?: string;
  answer: string;
  acceptAlternatives?: string[];
};

export type AudioMatchExercise = ExerciseBase & {
  type: 'audioMatch';
  audio: string;
  options: string[];
  correctIndex: number;
};

export type TypeTranslationExercise = ExerciseBase & {
  type: 'typeTranslation';
  direction: 'ru-to-en' | 'en-to-ru';
  answer: string;
  acceptAlternatives?: string[];
};

export type SpeakPhraseExercise = ExerciseBase & {
  type: 'speakPhrase';
  phrase: string;
  phraseEn?: string;
  audio: string;
};

export type GrammarSelectExercise = ExerciseBase & {
  type: 'grammarSelect';
  options: string[];
  correctIndex: number;
};

export type WordTableExercise = ExerciseBase & {
  type: 'wordTable';
};

export type FlashcardDeckExercise = ExerciseBase & {
  type: 'flashcardDeck';
};

export type WordOrderExercise = ExerciseBase & {
  type: 'wordOrder';
  audio?: string;
  sentence: string;
  sentenceEn?: string;
  tokens: string[];
  pool: string[];
};

export type PictureMatchExercise = ExerciseBase & {
  type: 'pictureMatch';
  image: string;
  options: string[];
  correctIndex: number;
};

export type Exercise =
  | McqExercise
  | FillBlankExercise
  | AudioMatchExercise
  | TypeTranslationExercise
  | SpeakPhraseExercise
  | GrammarSelectExercise
  | WordTableExercise
  | FlashcardDeckExercise
  | WordOrderExercise
  | PictureMatchExercise;

export type DayPlan = {
  day: number;
  theme: string;
  grammarFocus: string;
  words: Word[];
  exercises: Exercise[];
  speakingPrompts?: string[];
};

export type SessionBlock = 'intro' | 'flashcards' | 'listening' | 'pictures';

export type BlockConfig = {
  id: SessionBlock;
  label: string;
  durationMinutes: number;
};

export const SESSION_BLOCKS: BlockConfig[] = [
  { id: 'intro', label: 'Vocabulary', durationMinutes: 5 },
  { id: 'flashcards', label: 'Flashcards', durationMinutes: 10 },
  { id: 'listening', label: 'Listening', durationMinutes: 10 },
  { id: 'pictures', label: 'Pictures', durationMinutes: 5 },
];

export const SESSION_DURATION_SECONDS = SESSION_BLOCKS.reduce(
  (sum, b) => sum + b.durationMinutes * 60,
  0,
);

export type DayStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped';

export type SRSRecord = {
  wordId: string;
  ease: number;
  intervalDays: number;
  nextReview: string;
  lapses: number;
  repetitions: number;
};

export type AppSettings = {
  transliteration: boolean;
  sessionMinutes: number;
};

export type PlanDayEntry = {
  day: number;
  pinned: boolean;
  status: DayStatus;
  /** 0–1 lesson completion when status is in_progress */
  progress?: number;
};

export type PersistedState = {
  planOrder: number[];
  planDays: Record<number, PlanDayEntry>;
  srs: Record<string, SRSRecord>;
  streak: number;
  lastStudyDate: string | null;
  completedDays: number[];
  settings: AppSettings;
  currentDay: number | null;
};

export type SessionStats = {
  newWords: number;
  exercisesCompleted: number;
  exercisesCorrect: number;
};

export function isDayPlan(value: unknown): value is DayPlan {
  if (!value || typeof value !== 'object') return false;
  const d = value as DayPlan;
  return (
    typeof d.day === 'number' &&
    typeof d.theme === 'string' &&
    typeof d.grammarFocus === 'string' &&
    Array.isArray(d.words) &&
    Array.isArray(d.exercises)
  );
}

export function validateDayPlan(day: DayPlan): string[] {
  const errors: string[] = [];
  if (day.words.length === 0) errors.push(`Day ${day.day}: no words`);
  if (day.exercises.length === 0) errors.push(`Day ${day.day}: no exercises`);

  const wordOrderCount = day.exercises.filter((e) => e.type === 'wordOrder').length;
  if (wordOrderCount === 0) {
    errors.push(`Day ${day.day}: no wordOrder listening exercises`);
  }

  const wordIds = new Set(day.words.map((w) => w.id));
  for (const word of day.words) {
    if (!word.ru || !word.en) errors.push(`Day ${day.day}: word ${word.id} missing ru/en`);
    if (!word.audio) errors.push(`Day ${day.day}: word ${word.id} missing audio`);
    if (!word.image) errors.push(`Day ${day.day}: word ${word.id} missing image`);
    if (word.sentences.length === 0) errors.push(`Day ${day.day}: word ${word.id} has no sentences`);
  }

  for (const ex of day.exercises) {
    if (ex.wordId && !wordIds.has(ex.wordId)) {
      errors.push(`Day ${day.day}: exercise ${ex.id} references unknown word ${ex.wordId}`);
    }
    if (ex.type === 'wordOrder') {
      if (!ex.sentence || ex.tokens.length === 0 || ex.pool.length === 0) {
        errors.push(`Day ${day.day}: wordOrder ${ex.id} missing sentence, tokens, or pool`);
      }
    }
    if (ex.type === 'pictureMatch') {
      if (!ex.image || ex.options.length < 2 || ex.correctIndex < 0 || ex.correctIndex >= ex.options.length) {
        errors.push(`Day ${day.day}: pictureMatch ${ex.id} invalid image or options`);
      }
    }
  }

  return errors;
}

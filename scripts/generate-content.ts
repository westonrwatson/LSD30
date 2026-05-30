import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { CURRICULUM } from './curriculum-data.ts';
import { CURRICULUM_PART2 } from './curriculum-data-part2.ts';
import { CURRICULUM_PART3 } from './curriculum-data-part3.ts';
import { CURRICULUM_PART4 } from './curriculum-data-part4.ts';
import { CURRICULUM_PART5 } from './curriculum-data-part5.ts';
import { tokenizeRu } from '../src/lib/tokenize.ts';
import { buildVocabSvg } from './vocab-icons.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'content', 'days');
const imageDir = join(__dirname, '..', 'public', 'images', 'vocab');
mkdirSync(outDir, { recursive: true });
mkdirSync(imageDir, { recursive: true });

function slug(s: string): string {
  return s
    .replace(/[^a-z0-9\u0400-\u04FF]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 40) || 'word';
}

type RawWord = {
  ru: string;
  en: string;
  stress?: string;
  s1: string;
  s1en: string;
  s2: string;
  s2en: string;
};

type RawDay = {
  day: number;
  theme: string;
  grammarFocus: string;
  words: RawWord[];
  grammarPrompts: { prompt: string; options: string[]; correct: number }[];
  speakingPrompts: string[];
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDay(raw: RawDay) {
  const dayStr = String(raw.day).padStart(2, '0');
  const words = raw.words.map((word, i) => {
    const id = `d${dayStr}-w${String(i + 1).padStart(2, '0')}`;
    const audioSlug = slug(word.ru);
    const imagePath = `/images/vocab/${id}.svg`;
    writeFileSync(join(imageDir, `${id}.svg`), buildVocabSvg(word.en, word.ru), 'utf-8');
    return {
      id,
      ru: word.ru,
      en: word.en,
      stress: word.stress,
      audio: `/audio/day${dayStr}/${audioSlug}.mp3`,
      image: imagePath,
      sentences: [
        { ru: word.s1, en: word.s1en },
        { ru: word.s2, en: word.s2en },
      ],
    };
  });

  const exercises: Record<string, unknown>[] = [];
  let orderIndex = 0;

  words.forEach((word) => {
    word.sentences.forEach((sentence) => {
      const tokens = tokenizeRu(sentence.ru);
      if (tokens.length < 2) return;

      const distractorWords = shuffle(
        words.filter((w) => w.id !== word.id).map((w) => w.ru),
      ).slice(0, Math.min(3, words.length - 1));

      exercises.push({
        id: `d${dayStr}-order-${orderIndex++}`,
        type: 'wordOrder',
        wordId: word.id,
        prompt: 'Listen and put the words in order:',
        sentence: sentence.ru,
        sentenceEn: sentence.en,
        audio: '',
        tokens,
        pool: shuffle([...tokens, ...distractorWords]),
      });
    });
  });

  words.forEach((word, i) => {
    const distractors = shuffle(words.filter((w) => w.id !== word.id).map((w) => w.ru)).slice(
      0,
      Math.min(3, words.length - 1),
    );
    const options = shuffle([word.ru, ...distractors]);
    exercises.push({
      id: `d${dayStr}-pic-${String(i + 1).padStart(2, '0')}`,
      type: 'pictureMatch',
      wordId: word.id,
      prompt: 'Which word matches this picture?',
      image: word.image,
      options,
      correctIndex: options.indexOf(word.ru),
    });
  });

  return {
    day: raw.day,
    theme: raw.theme,
    grammarFocus: raw.grammarFocus,
    words,
    exercises,
  };
}

const allDays = [
  ...CURRICULUM,
  ...CURRICULUM_PART2,
  ...CURRICULUM_PART3,
  ...CURRICULUM_PART4,
  ...CURRICULUM_PART5,
];

for (const raw of allDays) {
  const day = buildDay(raw);
  const path = join(outDir, `day-${String(raw.day).padStart(2, '0')}.json`);
  writeFileSync(path, JSON.stringify(day, null, 2));
  console.log(`Wrote ${path}`);
}

console.log(`Generated ${allDays.length} day files and ${allDays.reduce((n, d) => n + d.words.length, 0)} vocab images.`);

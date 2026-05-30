import type { RawWord } from './curriculum-data';

export function w(
  ru: string,
  en: string,
  s1: string,
  s1en: string,
  s2: string,
  s2en: string,
  stress?: string,
): RawWord {
  return { ru, en, stress, s1, s1en, s2, s2en };
}

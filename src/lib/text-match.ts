const CYRILLIC_MAP: Record<string, string> = {
  a: 'а', b: 'б', v: 'в', g: 'г', d: 'д', e: 'е', yo: 'ё', zh: 'ж', z: 'з',
  i: 'и', y: 'й', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р',
  s: 'с', t: 'т', u: 'у', f: 'ф', kh: 'х', h: 'х', ts: 'ц', c: 'ц', ch: 'ч',
  sh: 'ш', sch: 'щ', shch: 'щ', yu: 'ю', ya: 'я', ye: 'е', x: 'кс',
  w: 'в', q: 'к', j: 'дж',
};

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:"«»()—–\-]/g, '')
    .replace(/\s+/g, ' ');
}

export function transliterateToCyrillic(input: string): string {
  let result = input.toLowerCase().trim();
  const keys = Object.keys(CYRILLIC_MAP).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    result = result.replace(new RegExp(key, 'g'), CYRILLIC_MAP[key]);
  }
  return result;
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function answersMatch(
  userInput: string,
  expected: string,
  alternatives: string[] = [],
  useTransliteration = true,
): boolean {
  const candidates = [expected, ...alternatives];
  let normalizedInput = normalizeText(userInput);

  if (useTransliteration && !/[а-яё]/i.test(normalizedInput)) {
    normalizedInput = normalizeText(transliterateToCyrillic(normalizedInput));
  }

  for (const candidate of candidates) {
    const normalizedExpected = normalizeText(candidate);
    if (normalizedInput === normalizedExpected) return true;

    const maxLen = Math.max(normalizedInput.length, normalizedExpected.length);
    if (maxLen === 0) continue;
    const distance = levenshtein(normalizedInput, normalizedExpected);
    const threshold = maxLen <= 4 ? 1 : maxLen <= 8 ? 2 : 3;
    if (distance <= threshold) return true;
  }

  return false;
}

export function speechMatches(transcript: string, expected: string): boolean {
  return answersMatch(transcript, expected, [], false);
}

/** Split a Russian sentence into word tokens for ordering exercises. */
export function tokenizeRu(sentence: string): string[] {
  return tokenizeWords(sentence);
}

/** Split an English sentence into word tokens for ordering exercises. */
export function tokenizeEn(sentence: string): string[] {
  return tokenizeWords(sentence);
}

function tokenizeWords(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .map((token) => token.replace(/^[«"'(\[]+|[»"')\].,!?:;—–-]+$/gu, ''))
    .filter(Boolean);
}

export function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[.,!?;:—–-]+$/g, '');
}

export function tokensMatch(selected: string[], expected: string[]): boolean {
  if (selected.length !== expected.length) return false;
  return selected.every((t, i) => normalizeToken(t) === normalizeToken(expected[i]!));
}

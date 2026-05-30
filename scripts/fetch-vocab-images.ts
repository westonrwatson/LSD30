import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { iconCategoryForWord, type IconCategory } from './vocab-icons.ts';

const USER_AGENT = 'Povtori/1.0 (https://github.com/westonrwatson/Povtori; vocabulary image fetch)';
const API = 'https://commons.wikimedia.org/w/api.php';
const REQUEST_DELAY_MS = 300;

const CATEGORY_HINT: Partial<Record<IconCategory, string>> = {
  greet: 'greeting people',
  goodbye: 'goodbye wave',
  thanks: 'thank you',
  please: 'please gesture',
  sorry: 'sorry apology',
  name: 'name tag identity',
  good: 'thumbs up',
  number: 'number digit',
  food: 'food',
  drink: 'drink beverage',
  family: 'family people',
  home: 'house home',
  place: 'city building',
  travel: 'travel luggage',
  weather: 'weather sky',
  time: 'clock time',
  body: 'human body',
  color: 'colors',
  animal: 'animal',
  work: 'office work',
  school: 'school classroom',
  money: 'money coins',
  shop: 'shop store',
  health: 'hospital health',
  emotion: 'emotion face',
  clothing: 'clothing',
  nature: 'nature landscape',
  transport: 'transport vehicle',
  question: 'question mark',
  language: 'language speech',
};

const SKIP_TITLE = /\b(icon|logo|svg|diagram|chart|map|flag|coat of arms|symbol|clipart|silhouette)\b/i;
const SKIP_MIME = /\.(svg|pdf|ogg|webm|gif)$/i;

export type VocabImageResult = {
  webPath: string;
  credit: string;
  sourceUrl: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function primaryEnglish(en: string): string {
  return en
    .replace(/\([^)]*\)/g, '')
    .split('/')[0]!
    .replace(/'/g, '')
    .trim();
}

export function buildImageSearchQuery(en: string): string {
  const primary = primaryEnglish(en);
  const hint = CATEGORY_HINT[iconCategoryForWord(en)];
  return hint ? `${primary} ${hint}` : primary;
}

type CommonsHit = {
  title: string;
  thumburl?: string;
  url?: string;
  credit?: string;
  license?: string;
};

async function searchCommons(query: string): Promise<CommonsHit[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '8',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '640',
    iiextmetadatafilter: 'LicenseShortName|Credit|Artist',
  });

  const res = await fetch(`${API}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title: string;
          imageinfo?: Array<{
            thumburl?: string;
            url?: string;
            extmetadata?: Record<string, { value?: string }>;
          }>;
        }
      >;
    };
  };

  const pages = data.query?.pages ?? {};
  const hits: CommonsHit[] = [];

  for (const page of Object.values(pages)) {
    const title = page.title ?? '';
    if (SKIP_TITLE.test(title)) continue;

    const info = page.imageinfo?.[0];
    if (!info?.thumburl && !info?.url) continue;

    const fileUrl = info.url ?? info.thumburl ?? '';
    if (SKIP_MIME.test(fileUrl)) continue;

    const meta = info.extmetadata ?? {};
    const stripHtml = (s: string) =>
      s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    hits.push({
      title,
      thumburl: info.thumburl,
      url: info.url,
      credit: stripHtml(meta.Credit?.value ?? meta.Artist?.value ?? 'Wikimedia Commons'),
      license: stripHtml(meta.LicenseShortName?.value ?? 'CC'),
    });
  }

  return hits.sort((a, b) => a.title.length - b.title.length);
}

function extensionFromUrl(url: string): string {
  const match = url.match(/\.(jpe?g|png|webp)(?:$|[?/])/i);
  return match ? `.${match[1]!.toLowerCase().replace('jpeg', 'jpg')}` : '.jpg';
}

async function downloadImage(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 4000) return false;
    writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

export async function fetchVocabImage(
  en: string,
  wordId: string,
  outDir: string,
  attributionsPath: string,
): Promise<VocabImageResult | null> {
  mkdirSync(outDir, { recursive: true });

  const attributions: Record<string, { credit: string; license: string; sourceUrl: string }> =
    existsSync(attributionsPath)
      ? JSON.parse(readFileSync(attributionsPath, 'utf-8'))
      : {};

  const existing = Object.entries(attributions).find(([key]) => key.startsWith(`${wordId}.`));
  if (existing) {
    const [filename, meta] = existing;
    const diskPath = join(outDir, filename);
    if (existsSync(diskPath)) {
      return {
        webPath: `/images/vocab/${filename}`,
        credit: meta.credit,
        sourceUrl: meta.sourceUrl,
      };
    }
  }

  const query = buildImageSearchQuery(en);
  const hits = await searchCommons(query);
  await sleep(REQUEST_DELAY_MS);

  for (const hit of hits) {
    const downloadUrl = hit.thumburl ?? hit.url;
    if (!downloadUrl) continue;

    const ext = extensionFromUrl(downloadUrl);
    const filename = `${wordId}${ext}`;
    const diskPath = join(outDir, filename);
    const ok = await downloadImage(downloadUrl, diskPath);
    if (!ok) continue;

    const credit = `${hit.credit} (${hit.license} via Wikimedia Commons)`;
    const sourceUrl = hit.url ?? downloadUrl;
    attributions[filename] = { credit, license: hit.license ?? 'CC', sourceUrl };
    writeFileSync(attributionsPath, JSON.stringify(attributions, null, 2));

    return {
      webPath: `/images/vocab/${filename}`,
      credit,
      sourceUrl,
    };
  }

  return null;
}

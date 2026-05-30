# Povtori

Single-page Russian study app: 30-minute daily sessions with themed vocabulary, grammar, listening, and speaking practice.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build (validates content first) |
| `npm run preview` | Preview production build |
| `npm run generate` | Regenerate 30 day JSON files from curriculum scripts |
| `npm run validate` | Validate all day content files |

## Features

- **30 themed days** — greetings, numbers, animals, grammar, travel, idioms, and more
- **30-minute countdown** session with warm-up SRS, vocab, grammar, listening, speaking blocks
- **Exercise types** — multiple choice, fill-in-blank, audio match, typing, speech recognition
- **Spaced repetition** — review queue from past days (1 → 3 → 7 → 14 → 28 day intervals)
- **Plan view** — drag to reorder days, pin priorities, track streak
- **Audio** — TTS fallback via Web Speech API (`ru-RU`); MP3 paths ready at `/public/audio/dayXX/`
- **Minimal UI** — black & white, sharp corners, bold sans-serif

## Speech recognition

Works best in **Chrome** or **Edge**. Uses the Web Speech API with fuzzy matching for accent tolerance. Falls back to self-check if unavailable.

## Deploy

Build static files:

```bash
npm run build
```

Deploy the `dist/` folder to any static host:

- **Netlify**: connect repo or drag `dist/` to [Netlify Drop](https://app.netlify.com/drop)
- **Vercel**: `npx vercel dist`
- **GitHub Pages**: set base to `./` (already configured in `vite.config.ts`)

## Content structure

```
content/days/day-01.json … day-30.json
scripts/curriculum-data*.ts   — source vocabulary
scripts/generate-content.ts   — builds JSON + exercises
```

To edit curriculum: update the `curriculum-data*.ts` files, then run `npm run generate`.

## Audio files (optional)

Word audio paths are set in JSON (e.g. `/audio/day01/privet.mp3`). Without MP3 files, the app uses browser TTS automatically. To add recordings, place MP3s under `public/audio/dayXX/`.

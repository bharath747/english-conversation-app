# Little English Friends 🦊

A mobile-first PWA that helps a 5-year-old Telugu-speaking child learn spoken English through tiny conversations, Telugu comparisons, speech input, speech output, and games.

## What is included

- **Talk mode** — tap the microphone and speak; the app reads the reply aloud.
- **Telugu bridge** — every starter lesson pairs English with a simple Telugu meaning/sentence.
- **Learn mode** — one small word and sentence at a time.
- **Games mode** — picture-based vocabulary practice with stars.
- **Child-friendly coaching** — short sentences, praise-first corrections, one question at a time.
- **PWA** — installable on mobile and basic lessons work offline after the first load.
- **Optional AI** — `/api/chat` uses a server-side OpenAI key when configured; the browser never receives the key.

## Local run

```bash
npm install
npm start
```

Open `http://localhost:4200`.

The browser speech APIs work best in Chrome/Chromium. If speech recognition is unavailable, the quick-answer buttons still work.

## Vercel

The repository is intentionally simple: static PWA files at the root plus a Vercel-compatible `/api/chat.js` function. Set `OPENAI_API_KEY` in Vercel project environment variables to enable adaptive AI conversation. Optionally set `OPENAI_MODEL` (default: `gpt-5.6-luna`).

Without the key, the app remains usable with its built-in conversation fallback, so the PWA does not depend on an AI server for its core learning experience.

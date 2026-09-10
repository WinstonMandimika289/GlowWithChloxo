# Glow With Chlo

The website for **Glow With Chlo** — skin, aesthetics & nail care across North Wales & Liverpool.
Built with [Astro](https://astro.build), GSAP + Lenis for motion, and a Groq-powered chat assistant.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:4321 (hot reload)
# or a production-like run:
npm run build && npm start
```

Requires Node 22.12+.

## The AI chat assistant ("Glow")

1. Create a free key at <https://console.groq.com/keys>.
2. Copy `.env.example` to `.env` and set `GROQ_API_KEY=...` (`.env` is gitignored and only read on the server).
3. Restart `npm run dev` / `npm start`.

Without a key — or if Groq is busy/rate-limited — the widget automatically answers from its built-in
knowledge of the menu (`src/lib/localBot.ts`), so it always works. The model defaults to
`openai/gpt-oss-120b` (fallback `openai/gpt-oss-20b`); override with `GROQ_MODEL`.

## Editing prices & treatments

Everything — cards, detail pages, the price list, SEO data and the chatbot's knowledge — comes from:

- `src/data/services.ts` — every treatment, price, duration, description and image
- `src/data/site.ts` — contact details, reviews, FAQs, navigation

Change a price there and it updates everywhere. Images live in `src/assets/` and are optimised
(AVIF/WebP, responsive sizes) at build time.

## Project structure

```
src/
  components/   Header, Footer, Marquee, ServiceCard, ChatWidget, …
  data/         services.ts, site.ts  ← edit content here
  layouts/      Layout.astro (SEO, fonts, view transitions)
  lib/          chat prompt, Groq client, local bot, markdown renderer
  pages/        routes (index, treatments/[slug], nails, prices, …) + api/chat.ts
  scripts/      motion.ts (GSAP/Lenis), ui.ts, chat.ts
  styles/       tokens.css (design tokens), global.css
worker/         groq-proxy.js — Cloudflare Worker for static hosting
```

## Deploying

- **Node host** (e.g. a VPS or Node hosting): `npm run build` then `npm start` — serves the site and `/api/chat`.
- **GitHub Pages / static hosting**: the workflow in `.github/workflows/static.yml` builds with
  `DEPLOY_TARGET=static` (no server). Deploy `worker/groq-proxy.js` to Cloudflare for the AI chat and set the
  repository variable `PUBLIC_CHAT_ENDPOINT` to the worker URL; otherwise the chat uses its built-in answers.

Old page URLs (`facial.html`, `Nails.html`, …) redirect to the new pages.

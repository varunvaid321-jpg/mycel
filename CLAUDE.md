# Mycel — Development Rules

## What is Mycel
Private AI-powered personal journal at amushroom.com. Captures thoughts via typing or voice, auto-corrects, auto-categorizes, analyzes links, and provides AI-guided weekly/monthly insights. Single user, passphrase auth, fully anonymous.

## Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS v3
- **Backend**: Next.js API routes (App Router)
- **Database**: SQLite via Prisma (persistent disk on Render at `/data/mycel.db`)
- **AI**: Cloudflare Workers AI (Llama 3.1 8B) — free 10k req/day
- **Hosting**: Render (Starter plan, web service `srv-d6urbjeuk2gs738dbkog`)
- **Domain**: www.amushroom.com (Cloudflare DNS, proxied)
- **Auto-deploy**: GitHub Actions → Render API on push to main
- **Repo**: github.com/varunvaid321-jpg/mycel (public)

## Rules

### PR-only workflow
- NEVER push directly to main
- Branch → changes → `npx next build` passes → push → `gh pr create` → `gh pr merge N --squash`
- Every PR auto-deploys via GitHub Actions

### Build command (Render)
```
npm install --include=dev && npx prisma generate && npx next build
```
`--include=dev` is required because Render skips devDependencies in production.

### Start command (Render)
```
node server.js
```
`server.js` runs `prisma db push` then starts Next.js programmatically.

### API routes
- All non-static API routes MUST have `export const dynamic = "force-dynamic"`
- Without this, Next.js tries to pre-render them at build time and fails

### Database
- Schema: `prisma/schema.prisma` (SQLite)
- After schema changes: run `npx prisma generate` locally
- On Render: `server.js` runs `prisma db push --accept-data-loss` on startup
- Entry model fields: id, content, category, localDate, localTime, createdAt, updatedAt, isPublic, archived, tags, linkedEntryIds

### AI (Cloudflare Workers AI)
- Env vars: `CF_ACCOUNT_ID` + `CF_AI_API_KEY`
- Model: `@cf/meta/llama-3.1-8b-instruct`
- All AI functions in `src/lib/ai.ts` — ask() is the single call point
- Always return null on failure — never crash, always fall back gracefully
- Auto-correct uses AI on every save (cleans typos/grammar)
- Weekly/monthly briefs, guide, video/web analysis all use AI
- Prompts must ask for JSON and use extractJSON() to parse (strips markdown fences)

### Emotional detector
- Pure client-side, no API call — `src/lib/emotional-detect.ts`
- Pattern-matches anger, anxiety, stress, frustration, sadness
- Shows instant guidance in compose box before save

### Auto-classifier
- `src/lib/classifier.ts` — keyword-based, no AI
- Entry types: spore, root, signal, decompose, fruit
- Life topics: health, money, retirement, housing, family, career, relationships, growth, creativity, travel

### URL analysis
- `/api/analyze` handles ALL URLs (YouTube + web)
- YouTube: transcript via `youtube-transcript` package, falls back to bookmark if no captions
- Web: extracts text via `cheerio`, strips nav/ads/scripts
- AI analyzes with user's note as context lens
- Falls back to raw excerpt if AI unavailable

### Timezone
- All dates/times forced to `America/Toronto` (EST/EDT)
- Set `timeZone: "America/Toronto"` on all `toLocaleDateString`/`toLocaleTimeString` calls

### Security
- Passphrase auth via env var `MYCEL_PASSPHRASE`
- Geo-check: allows CA + US countries (via `cf-ipcountry` header)
- Outside CA/US: secret question challenge ("hannover")
- Session: httpOnly cookie, 30-day expiry
- `noindex, nofollow` on all pages
- No analytics, no tracking, no social, no comments

### Theme
- Dark forest: bg #0a0a08, surface #141410
- ALL text must be bright and readable:
  - Primary: #ffffff (pure white)
  - Muted: #d4d0c8 (bright cream)
  - Faint: #b0a898 (visible warm — NOT dim)
- Accent: #d4aa7c (warm gold)
- Fonts: EB Garamond (serif), JetBrains Mono (mono)
- Never make any text hard to read

### Env vars on Render
```
DATABASE_URL=file:/data/mycel.db
MYCEL_PASSPHRASE=***
NODE_ENV=production
CF_ACCOUNT_ID=e03e2882012ddf881ecf0753cf8a7c92
CF_AI_API_KEY=***
```
NEVER change env vars without explicit authorization.

### Mobile
- All touch targets minimum 44px (min-h-[44px] min-w-[44px])
- Compose controls stack vertically on mobile
- Filter pills wrap naturally
- No horizontal overflow anywhere

### Key files
- `server.js` — production entry point (prisma push + Next.js)
- `src/lib/ai.ts` — all AI functions (Cloudflare Workers AI)
- `src/lib/classifier.ts` — auto-categorize + auto-tag
- `src/lib/emotional-detect.ts` — real-time emotion detection
- `src/lib/youtube.ts` — YouTube transcript + metadata
- `src/lib/web-extract.ts` — web page content extraction
- `src/app/api/analyze/route.ts` — universal URL analyzer
- `src/app/api/guide/route.ts` — intelligent AI guide
- `src/app/api/weekly/route.ts` — weekly brief (AI + fallback)
- `src/app/api/monthly/route.ts` — monthly review
- `src/components/compose.tsx` — main input (typing, voice, URL detection, emotional detector)
- `src/components/daily-nudge.tsx` — intelligent guide display
- `src/components/weekly-summary.tsx` — weekly brief panel
- `.github/workflows/deploy.yml` — auto-deploy to Render

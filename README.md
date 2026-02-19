# My Phish Shows

A full-stack web app for Phish fans to track shows they've attended and explore stats about their Phish experience.

## Architecture

- **Frontend**: React SPA built with Vite — dark concert-lighting theme, interactive calendar, stats dashboard
- **Backend**: Node/Express-style Vercel Serverless Functions — proxies Phish.net API, caches data in Vercel KV
- **Cache**: Vercel KV (Redis) — stores shows index, setlists, and songs catalog

## Features

- **Calendar view** with year/month jump control for navigating 40+ years of Phish history
- Show dates are highlighted; clicking opens a setlist drawer
- **Selected shows tray** persists across sessions via `localStorage`
- **Stats dashboard**: unique songs, rarest songs, most-seen songs, favorite venues, year breakdown, timeline
- **Animated background**: concert-lighting gradient that randomizes palette on each load
- Daily cron job syncs only new shows — no re-seeding of historical data
- Cold-start seeding progress indicator on first launch

---

## Estimated KV Storage

| Data                  | Approx size         |
|-----------------------|---------------------|
| Shows index (~1,900 shows)     | ~380 KB   |
| Per-year caches (40 years)     | ~190 KB   |
| Setlists (cached lazily, ~2KB/show) | up to ~3.8 MB |
| Songs catalog (~900 songs)     | ~90 KB    |
| **Total (fully loaded)**       | **< 5 MB** |

This is well within Vercel KV's free-tier 256 MB limit.

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- A Vercel account with a project created

---

## Local Development

```bash
npm install
vercel dev        # starts both the API and Vite dev server
```

The Vite dev server proxies `/api/*` to the local Vercel function runtime.

For local development without Vercel KV, set `KV_REST_API_URL` and `KV_REST_API_TOKEN`
in a `.env.local` file (see below).

---

## Environment Variables

| Variable             | Description                                      |
|----------------------|--------------------------------------------------|
| `PHISH_NET_API_KEY`  | Your Phish.net API key (already embedded)        |
| `KV_REST_API_URL`    | REST URL from Vercel KV dashboard                |
| `KV_REST_API_TOKEN`  | Auth token from Vercel KV dashboard              |
| `CRON_SECRET`        | Optional — used to authenticate cron requests    |

Create a `.env.local` for local dev:
```
PHISH_NET_API_KEY=84D2574B2E94EFAF3EBE
KV_REST_API_URL=https://your-kv-url.kv.vercel-storage.com
KV_REST_API_TOKEN=your_token_here
```

---

## Deployment to Vercel

### Step 1: Create the Vercel KV Store

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Open your project (or create one: `vercel link`)
3. Navigate to **Storage** → **Create Database** → **KV (Redis)**
4. Name it (e.g., `phish-shows-kv`) and click **Create**
5. Go to **Settings** → **Environment Variables** in the KV store
6. Copy the values for `KV_REST_API_URL` and `KV_REST_API_TOKEN`

### Step 2: Link KV Variables to the Project

In the Vercel Dashboard for your project:
1. Go to **Settings** → **Environment Variables**
2. Add the following:
   - `KV_REST_API_URL` → paste from KV store
   - `KV_REST_API_TOKEN` → paste from KV store
   - `PHISH_NET_API_KEY` → `84D2574B2E94EFAF3EBE`
   - `CRON_SECRET` → any random secret string (e.g., output of `openssl rand -hex 32`)

Alternatively, use the CLI:
```bash
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add PHISH_NET_API_KEY
vercel env add CRON_SECRET
```

Or link the KV store directly:
```bash
vercel link                          # link local dir to Vercel project
vercel storage connect               # follow prompts to connect the KV store
```
This auto-injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

### Step 3: Deploy

```bash
npm run build     # verify the frontend builds cleanly
vercel --prod     # deploy to production
```

The first page load will trigger cold-start seeding. The app shows a progress
indicator while shows and songs are fetched from Phish.net and cached in KV.

### Cron Job

`vercel.json` configures a daily cron at **3:00 AM UTC** that hits `/api/cron/sync`.
This fetches only shows newer than the last sync timestamp, so historical data is never
re-seeded. Vercel's cron will automatically pass the `Authorization: Bearer <CRON_SECRET>`
header if you set `CRON_SECRET` in environment variables via the Vercel dashboard.

---

## Project Structure

```
my-phish-shows/
├── api/
│   ├── _lib/
│   │   ├── kv.js            # Vercel KV helpers & key constants
│   │   ├── phishnet.js      # Phish.net API client (never exposes key to client)
│   │   └── seed.js          # Seeding & incremental sync logic
│   ├── years.js             # GET /api/years
│   ├── shows/
│   │   └── [year].js        # GET /api/shows/:year
│   ├── setlist/
│   │   └── [showdate].js    # GET /api/setlist/:showdate
│   ├── songs.js             # GET /api/songs
│   ├── cache/
│   │   └── status.js        # GET /api/cache/status
│   └── cron/
│       └── sync.js          # Daily incremental sync
├── src/
│   ├── components/
│   │   ├── Background.jsx       # Animated concert-lighting canvas
│   │   ├── Calendar.jsx         # Interactive show calendar
│   │   ├── Dashboard.jsx        # Stats dashboard
│   │   ├── LoadingScreen.jsx    # Cold-start seeding progress
│   │   ├── ShowDetailDrawer.jsx # Show/setlist detail modal
│   │   ├── ShowTray.jsx         # Persistent selected shows tray
│   │   └── YearMonthPicker.jsx  # Year dropdown + month tabs
│   ├── hooks/
│   │   ├── useSelectedShows.js  # localStorage persistence
│   │   └── useShowsData.js      # Shows/years data loading
│   ├── api.js       # Frontend API client (calls /api/* only)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css    # Dark concert-lighting theme
├── index.html
├── package.json
├── vite.config.js
└── vercel.json      # Cron, rewrites, build config
```

---

## Phish.net API Rate Limits

Setlists are fetched **lazily** (only when a user opens a specific show), so no
bulk-fetching of 1,800+ setlists occurs on deploy. The shows index and songs catalog
are fetched in two quick API calls during the initial seed, completing in seconds.

The daily cron job is a single `shows.json` fetch plus one `songs.json` fetch —
well within any reasonable rate limit.

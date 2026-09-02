# ◎ OrbitOS — Space Traffic Management

Real-time satellite tracking, collision detection, and orbital intelligence.

---

## Get running in 10 minutes

### 1. Install dependencies

```bash
npm install
```

### 2. Get your free API keys (2 minutes each)

**Cesium Ion** (for the 3D globe imagery)
- Go to https://cesium.com/ion/signup
- Sign up free → copy your default token

**Supabase** (for auth + watchlists)
- Go to https://supabase.com → New project (free tier)
- Settings → API → copy URL and anon key
- Go to SQL Editor → run the schema below

### 3. Create your .env file

```bash
cp .env.example .env
```

Fill in your keys:
```
VITE_CESIUM_TOKEN=your_token_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Run Supabase SQL schema

In Supabase → SQL Editor → New Query, paste and run:

```sql
CREATE TABLE watchlist (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  satellite_id   INTEGER NOT NULL,
  satellite_name TEXT NOT NULL,
  category       TEXT,
  altitude_km    NUMERIC,
  threshold_km   NUMERIC DEFAULT 5,
  alert_email    BOOLEAN DEFAULT true,
  alert_push     BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, satellite_id)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own watchlist"
  ON watchlist FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE watchlist;
```

### 5. Start the dev server

```bash
npm run dev
```

Open http://localhost:5173 — you should see the loading screen
fetching real TLE data from Celestrak.

---

## Deploy to Vercel (free)

```bash
npm run build
npx vercel --prod
```

Add your environment variables in the Vercel dashboard under
Project → Settings → Environment Variables.

---

## Project structure

```
src/
├── App.jsx                        ← Root component (everything wired here)
├── main.jsx                       ← React entry point
├── index.css                      ← Global styles
│
├── components/
│   ├── Globe.jsx                  ← CesiumJS 3D globe
│   ├── MapView2D.jsx              ← 2D equirectangular map
│   ├── Sidebar.jsx                ← Search, filters, satellite list
│   └── AuthModal.jsx              ← Sign in / sign up
│
├── hooks/
│   ├── useTLEData.js              ← Fetch + cache TLEs from Celestrak
│   ├── useRealtimeSatellites.js   ← 5s propagation cycle via Web Worker
│   └── useAuth.js                 ← Supabase auth + watchlist hooks
│
├── services/
│   ├── tleService.js              ← TLE parsing, validation, caching
│   ├── propagator.js              ← SGP4 orbital mechanics helpers
│   └── supabaseClient.js          ← Supabase client + auth/watchlist fns
│
└── workers/
    └── propagationWorker.js       ← Web Worker: SGP4 off the main thread
```

---

## What it does

- **3D Globe** — CesiumJS globe with 9,000+ satellites rendered as dots,
  colour-coded by category, with clustering for dense areas
- **2D Map** — Flat equirectangular map with ground tracks
- **Real-time propagation** — SGP4 algorithm runs in a Web Worker,
  updates every 5 seconds, never freezes the UI
- **Collision detection** — Screens all satellite pairs every 5s,
  flags conjunctions under 5km threshold
- **Dashboard** — Live charts: category breakdown, orbit distribution,
  active conjunctions, engine performance
- **API docs** — REST API reference with example requests
- **Auth + watchlists** — Supabase auth, personal satellite watchlists
  synced in real-time across devices

---

## Tech stack

| Layer | Tool |
|-------|------|
| Frontend | React + Vite |
| 3D Globe | CesiumJS |
| Orbital mechanics | satellite.js (SGP4) |
| Styling | Inline styles (no Tailwind needed) |
| Data | Celestrak public TLE feeds |
| Auth/DB | Supabase (free tier) |
| Deployment | Vercel |

---

## Troubleshooting

**Blank globe / no imagery**
→ Your Cesium Ion token is wrong. Check cesium.com/ion/tokens

**"Cannot read properties of undefined (Cesium)"**
→ Cesium loads from CDN. Check your internet connection and try again.

**TLE fetch fails / CORS error**
→ Celestrak sometimes rate-limits. The app falls back to cached data.
→ Try `npm run dev` — the Vite proxy handles CORS in development.

**Satellites not moving**
→ The Web Worker might have failed to load. Check browser console.
→ The app falls back to main-thread propagation automatically.

**Auth not working**
→ Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
→ Make sure you ran the SQL schema in Supabase

---

Built by Ollie · OrbitOS v0.1.0

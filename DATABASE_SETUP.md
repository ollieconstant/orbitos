# OrbitOS Database Setup

## What this gives you
- Your own satellite database — no more Celestrak dependency
- Data ingested every 6 hours automatically via Vercel cron
- Full TLE history stored (valuable for Enterprise customers)
- Your own REST API (api.orbitos.space/v1/satellites)
- Rate limiting + usage tracking per customer

---

## Step 1 — Create Supabase project (5 min)

1. Go to supabase.com → New project
2. Name it `orbitos`, choose a region close to you (London)
3. Wait for it to spin up (~2 min)
4. Go to **Settings → API**
5. Copy:
   - **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY` (keep this secret — never expose in frontend)

---

## Step 2 — Run the database schema (2 min)

1. In Supabase → **SQL Editor → New Query**
2. Open the file `database.sql` from this project
3. Copy all of it → paste → click **Run**
4. You should see "Success. No rows returned"

---

## Step 3 — Register Space-Track account (10 min)

Space-Track.org is the official US Space Force satellite catalogue.
It's free, has no IP blocking, and is the most reliable source.

1. Go to space-track.org → Register
2. Use your real name and a legitimate email
3. In the "intended use" field write:
   "Space traffic management research and educational platform"
4. They approve accounts within 24 hours (usually minutes)
5. Once approved, add to Vercel:
   - `SPACETRACK_USERNAME` = your email
   - `SPACETRACK_PASSWORD` = your password

---

## Step 4 — Add all env vars to Vercel

Go to vercel.com → your project → Settings → Environment Variables

Add these:

| Variable | Where to get it |
|----------|----------------|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role key |
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SPACETRACK_USERNAME` | Your Space-Track email |
| `SPACETRACK_PASSWORD` | Your Space-Track password |
| `CRON_SECRET` | Make up a random string e.g. `orb_cron_abc123xyz` |

---

## Step 5 — Trigger first ingestion

After deploying:

1. Go to: `https://orbitos1.vercel.app/api/ingest`
   (with Authorization header: `Bearer your_CRON_SECRET`)

Or just wait — Vercel will run it automatically every 6 hours.

You can also trigger it manually from Vercel:
- Dashboard → your project → **Functions** → find `api/ingest` → **Test**

---

## Step 6 — Verify it worked

In Supabase → **Table Editor → tle_records**
You should see thousands of rows appearing.

In Supabase → **Table Editor → ingest_logs**
You should see a row showing the pipeline run and how many satellites were fetched.

---

## After setup

Your website will automatically use your own database.
The `/api/satellites` endpoint serves from Supabase.
The old Celestrak proxy is kept as a fallback only.

Ingestion runs every 6 hours via Vercel cron — completely free.

---

## Generating API keys for customers

When a customer subscribes to Pro, generate them an API key:

```js
import crypto from 'crypto'

const rawKey  = 'orb_live_' + crypto.randomBytes(32).toString('hex')
const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

// Store in database
await supabase.from('api_keys').insert({
  user_id:           userId,
  key_prefix:        rawKey.slice(0, 16),
  key_hash:          keyHash,
  plan:              'pro',
  requests_per_hour: 10000,
})

// Show rawKey to customer ONCE — never store it
console.log('API Key (show to customer once):', rawKey)
```

The customer gets `rawKey` — you only store the hash. 
If they lose it, generate a new one.

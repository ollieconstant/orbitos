# Deploying OrbitOS to Cloudflare Pages

## Why Cloudflare Pages?
- Unlimited bandwidth (Vercel caps you)
- No cold starts on functions
- Global edge network — faster everywhere
- Free forever for this scale

---

## Step 1 — Deploy to Cloudflare Pages (5 min)

1. Go to dash.cloudflare.com → sign up free
2. Click **Pages → Create a project → Connect to Git**
3. Select your GitHub account → choose `ollieconstant/orbitos`
4. Build settings:
   ```
   Framework preset:  Vite
   Build command:     npm run build
   Output directory:  dist
   Root directory:    (leave blank)
   ```
5. Click **Save and Deploy**

You get a URL like `orbitos.pages.dev` ✓

---

## Step 2 — Add environment variables

In Cloudflare Pages → your project → **Settings → Environment variables**

Add ALL of these:

| Variable | Value |
|----------|-------|
| `VITE_CESIUM_TOKEN` | from cesium.com/ion |
| `VITE_SUPABASE_URL` | from supabase.com |
| `VITE_SUPABASE_ANON_KEY` | from supabase.com |
| `SUPABASE_URL` | same as VITE_SUPABASE_URL |
| `SUPABASE_SERVICE_KEY` | service_role key from supabase.com |
| `STRIPE_SECRET_KEY` | from stripe.com |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | from stripe.com |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | from stripe.com |
| `STRIPE_WEBHOOK_SECRET` | from stripe.com |
| `RESEND_API_KEY` | from resend.com |
| `SPACETRACK_USERNAME` | your space-track.org email |
| `SPACETRACK_PASSWORD` | your space-track.org password |
| `APP_URL` | https://orbitos.pages.dev |

After adding → **Save and redeploy**

---

## Step 3 — Set up Supabase Edge Function (replaces Vercel cron)

The ingestion pipeline now runs as a Supabase Edge Function.

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   supabase login
   ```

2. Deploy the function:
   ```bash
   cd your-orbitos-folder
   supabase functions deploy ingest --project-ref YOUR_PROJECT_REF
   ```
   (Find YOUR_PROJECT_REF in Supabase → Settings → General)

3. Add secrets to the function:
   ```bash
   supabase secrets set SPACETRACK_USERNAME=your@email.com
   supabase secrets set SPACETRACK_PASSWORD=yourpassword
   ```

4. Schedule it every 6 hours:
   - Supabase dashboard → Edge Functions → ingest → Schedule
   - Cron expression: `0 */6 * * *`

---

## Step 4 — Add custom domain (optional)

In Cloudflare Pages → your project → **Custom domains**
Add `orbitos.space` (buy it from Cloudflare Registrar for ~£8/year)

---

## Step 5 — Update Stripe webhook URL

In Stripe dashboard → Developers → Webhooks → update endpoint URL to:
`https://orbitos.pages.dev/api/stripe-webhook`

---

## Your site routes

```
orbitos.pages.dev/           → Landing page
orbitos.pages.dev/app        → 3D globe app
orbitos.pages.dev/pricing    → Pricing page
orbitos.pages.dev/api/tle    → TLE proxy
orbitos.pages.dev/api/ingest → Manual ingest trigger
orbitos.pages.dev/v1/...     → Public REST API
```

---

## Testing functions locally

```bash
npm install -g wrangler
wrangler pages dev dist --compatibility-date=2024-01-01
```

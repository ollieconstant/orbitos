# OrbitOS Backend Setup Guide

## 1. Stripe (payments) — 15 minutes

### Create your Stripe account
1. Go to stripe.com → sign up free
2. Go to **Developers → API keys**
3. Copy your **Secret key** (starts with `sk_live_` or `sk_test_` for testing)
4. Add to Vercel: `STRIPE_SECRET_KEY`

### Create your products
1. Stripe dashboard → **Products → Add product**
2. Create **"OrbitOS Pro — Monthly"**
   - Price: £299/month recurring
   - Copy the **Price ID** (starts with `price_`)
   - Add to Vercel: `STRIPE_PRO_MONTHLY_PRICE_ID`
3. Create **"OrbitOS Pro — Annual"**
   - Price: £2,988/year recurring (= £249 × 12)
   - Copy the Price ID
   - Add to Vercel: `STRIPE_PRO_ANNUAL_PRICE_ID`

### Set up webhook
1. Stripe dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://orbitos1.vercel.app/api/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
4. Copy the **Signing secret** (starts with `whsec_`)
5. Add to Vercel: `STRIPE_WEBHOOK_SECRET`

---

## 2. Resend (emails) — 5 minutes

1. Go to resend.com → sign up free (100 emails/day free)
2. Go to **API Keys → Create API key**
3. Add to Vercel: `RESEND_API_KEY`
4. Add your domain (optional but recommended for deliverability):
   - Resend dashboard → Domains → Add domain
   - Add DNS records to your domain registrar
   - This lets emails send from `hello@orbitos.space` instead of a Resend domain

---

## 3. Add all keys to Vercel

Go to vercel.com → your orbitos project → **Settings → Environment Variables**

Add every key from `.env.example` with your real values.

After adding all keys → **Deployments → Redeploy**

---

## 4. Test it works

### Test Stripe (use test mode first)
- Use Stripe test mode: `sk_test_...` key
- Test card: `4242 4242 4242 4242`, any future date, any CVC
- Click "Start Pro trial" on your pricing page
- You should be redirected to Stripe checkout
- Complete with the test card
- Check Stripe dashboard → you should see a test subscription

### Test emails
- After completing a test checkout, check your inbox
- You should receive a welcome email
- Check Resend dashboard → Logs to see all emails sent

---

## 5. Go live

When you're ready:
1. Switch Stripe from test mode to live mode
2. Replace `sk_test_` with `sk_live_` in Vercel env vars
3. Update webhook to use live mode
4. Redeploy

You're now taking real payments. 💰

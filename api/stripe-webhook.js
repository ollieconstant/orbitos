// api/stripe-webhook.js
// Listens for Stripe events — subscription created, cancelled, payment failed
// Vercel receives the webhook from Stripe and runs this function

import Stripe from 'stripe'

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY)
  const rawBody   = await getRawBody(req)
  const signature = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  console.log('[Webhook] Event received:', event.type)

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object
      const email   = session.customer_email || session.customer_details?.email
      const plan    = session.metadata?.plan || 'pro'
      if (email) await sendWelcomeEmail(email, plan)
      break
    }

    case 'customer.subscription.created': {
      const sub   = event.data.object
      const email = await getEmailFromCustomer(stripe, sub.customer)
      if (email) await sendWelcomeEmail(email, 'pro')
      break
    }

    case 'customer.subscription.deleted': {
      const sub   = event.data.object
      const email = await getEmailFromCustomer(stripe, sub.customer)
      if (email) await sendCancellationEmail(email)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const email   = invoice.customer_email
      if (email) await sendPaymentFailedEmail(email)
      break
    }

    case 'invoice.payment_succeeded': {
      console.log('[Webhook] Payment succeeded for:', event.data.object.customer_email)
      break
    }
  }

  return res.status(200).json({ received: true })
}

async function getEmailFromCustomer(stripe, customerId) {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    return customer.email
  } catch { return null }
}

// ── EMAIL SENDERS ─────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from:    'OrbitOS <hello@orbitos.space>',
      to:      [to],
      subject,
      html,
    }),
  })
  if (!res.ok) console.error('[Email] Failed:', await res.text())
  return res.ok
}

async function sendWelcomeEmail(email, plan) {
  await sendEmail({
    to:      email,
    subject: 'Welcome to OrbitOS Pro 🛰',
    html: `
<!DOCTYPE html><html><body style="background:#0a1020;font-family:system-ui,sans-serif;color:#cbd5e1;margin:0;padding:20px;">
<div style="max-width:520px;margin:0 auto;background:#0f172a;border:1px solid rgba(56,189,248,0.2);border-radius:12px;overflow:hidden;">
  <div style="background:#38bdf8;padding:20px 28px;display:flex;align-items:center;gap:10px;">
    <span style="font-size:22px;color:#0f172a;">◎</span>
    <span style="font-weight:700;font-size:18px;color:#0f172a;letter-spacing:1px;">OrbitOS</span>
  </div>
  <div style="padding:28px;">
    <h1 style="color:#f1f5f9;font-size:22px;margin:0 0 12px;">Welcome to Pro 🎉</h1>
    <p style="color:rgba(148,163,184,0.7);line-height:1.8;margin:0 0 20px;">You now have full access to OrbitOS Pro — real-time conjunction alerts, the complete 27,000+ satellite catalogue, and full API access.</p>
    <div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:13px;color:#38bdf8;font-weight:600;">YOUR PRO PLAN INCLUDES</p>
      ${['10,000 API requests / hour','Full 27,000+ satellite catalogue','Real-time conjunction alerts','Email + push + webhook notifications','7-day orbit prediction','Priority support'].map(f=>`<p style="margin:4px 0;font-size:13px;color:#94a3b8;">✓ ${f}</p>`).join('')}
    </div>
    <a href="https://orbitos1.vercel.app/dashboard" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;margin-bottom:16px;">Open OrbitOS Dashboard →</a>
    <p style="font-size:12px;color:rgba(148,163,184,0.35);text-align:center;">Your 14-day free trial has started. You won't be charged until it ends.</p>
  </div>
  <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.07);font-size:12px;color:rgba(148,163,184,0.3);text-align:center;">
    Questions? Reply to this email or visit orbitos.space · © 2025 OrbitOS
  </div>
</div>
</body></html>`,
  })
}

async function sendCancellationEmail(email) {
  await sendEmail({
    to:      email,
    subject: 'Your OrbitOS Pro subscription has ended',
    html: `
<!DOCTYPE html><html><body style="background:#0a1020;font-family:system-ui,sans-serif;color:#cbd5e1;margin:0;padding:20px;">
<div style="max-width:520px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
  <div style="background:#0f172a;padding:20px 28px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:10px;">
    <span style="font-size:22px;color:#38bdf8;">◎</span>
    <span style="font-weight:700;font-size:18px;color:#38bdf8;">OrbitOS</span>
  </div>
  <div style="padding:28px;">
    <h1 style="color:#f1f5f9;font-size:20px;margin:0 0 12px;">Your Pro subscription has ended</h1>
    <p style="color:rgba(148,163,184,0.6);line-height:1.8;margin:0 0 20px;">Your account has been moved back to the free plan. Your data and settings are still saved.</p>
    <p style="color:rgba(148,163,184,0.6);line-height:1.8;margin:0 0 20px;">If you cancelled by mistake or want to resubscribe, you can upgrade again any time.</p>
    <a href="https://orbitos1.vercel.app/pricing" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">Resubscribe to Pro →</a>
  </div>
</div>
</body></html>`,
  })
}

async function sendPaymentFailedEmail(email) {
  await sendEmail({
    to:      email,
    subject: 'Action needed: OrbitOS payment failed',
    html: `
<!DOCTYPE html><html><body style="background:#0a1020;font-family:system-ui,sans-serif;color:#cbd5e1;margin:0;padding:20px;">
<div style="max-width:520px;margin:0 auto;background:#0f172a;border:1px solid rgba(239,68,68,0.25);border-radius:12px;overflow:hidden;">
  <div style="background:#0f172a;padding:20px 28px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;gap:10px;">
    <span style="font-size:22px;color:#38bdf8;">◎</span>
    <span style="font-weight:700;font-size:18px;color:#38bdf8;">OrbitOS</span>
  </div>
  <div style="padding:28px;">
    <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:12px 16px;margin-bottom:20px;">
      <p style="color:#f87171;font-weight:600;font-size:14px;margin:0;">⚠ Payment failed</p>
    </div>
    <h1 style="color:#f1f5f9;font-size:20px;margin:0 0 12px;">We couldn't process your payment</h1>
    <p style="color:rgba(148,163,184,0.6);line-height:1.8;margin:0 0 20px;">Your OrbitOS Pro subscription payment failed. Please update your payment method to keep Pro access.</p>
    <a href="https://orbitos1.vercel.app/dashboard/billing" style="display:block;text-align:center;background:#f87171;color:#fff;padding:12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">Update payment method →</a>
  </div>
</div>
</body></html>`,
  })
}

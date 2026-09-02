// functions/api/stripe-webhook.js — Cloudflare Worker version

async function verifyStripeSignature(body, signature, secret) {
  const parts     = signature.split(',')
  const timestamp = parts.find(p=>p.startsWith('t=')).slice(2)
  const v1        = parts.find(p=>p.startsWith('v1=')).slice(3)
  const payload   = `${timestamp}.${body}`
  const key       = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign'])
  const sig       = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const hex       = Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('')
  return hex === v1
}

async function sendEmail(resendKey, { to, subject, html }) {
  await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${resendKey}` },
    body:JSON.stringify({ from:'OrbitOS <hello@orbitos.space>', to:[to], subject, html }),
  })
}

export async function onRequestPost({ request, env }) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error:'Missing signature' }), { status:400 })
  }

  const valid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET)
  if (!valid) return new Response(JSON.stringify({ error:'Invalid signature' }), { status:400 })

  const event = JSON.parse(body)

  if (event.type === 'checkout.session.completed') {
    const email = event.data.object.customer_email || event.data.object.customer_details?.email
    if (email && env.RESEND_API_KEY) {
      await sendEmail(env.RESEND_API_KEY, {
        to: email,
        subject: 'Welcome to OrbitOS Pro 🛰',
        html: `
<div style="background:#0a1020;font-family:system-ui,sans-serif;padding:32px;color:#cbd5e1;max-width:520px;margin:0 auto">
  <div style="color:#38bdf8;font-size:22px;font-weight:700;margin-bottom:4px">◎ OrbitOS</div>
  <h1 style="color:#f1f5f9;font-size:22px;margin:20px 0 10px">Welcome to Pro 🎉</h1>
  <p style="color:rgba(148,163,184,0.7);line-height:1.8;margin-bottom:20px">You now have full access to OrbitOS Pro — real-time conjunction alerts, the complete 27,000+ satellite catalogue, and full API access. Your 14-day free trial has started.</p>
  <a href="https://orbitos.pages.dev/app" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;margin-bottom:16px">Open OrbitOS →</a>
  <p style="font-size:12px;color:rgba(148,163,184,0.3);text-align:center">Questions? Reply to this email · hello@orbitos.space</p>
</div>`,
      })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const custRes = await fetch(`https://api.stripe.com/v1/customers/${event.data.object.customer}`, {
      headers:{ 'Authorization':`Bearer ${env.STRIPE_SECRET_KEY}` }
    })
    const cust  = await custRes.json()
    const email = cust.email
    if (email && env.RESEND_API_KEY) {
      await sendEmail(env.RESEND_API_KEY, {
        to: email,
        subject: 'Your OrbitOS Pro subscription has ended',
        html: `<div style="background:#0a1020;font-family:system-ui,sans-serif;padding:32px;color:#cbd5e1;max-width:520px;margin:0 auto"><div style="color:#38bdf8;font-size:20px;font-weight:700;margin-bottom:16px">◎ OrbitOS</div><h1 style="color:#f1f5f9;font-size:20px;margin-bottom:10px">Your Pro subscription has ended</h1><p style="color:rgba(148,163,184,0.6);line-height:1.8;margin-bottom:20px">Your account has been moved to the free plan. Your data is still saved.</p><a href="https://orbitos.pages.dev/pricing" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">Resubscribe →</a></div>`,
      })
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const email = event.data.object.customer_email
    if (email && env.RESEND_API_KEY) {
      await sendEmail(env.RESEND_API_KEY, {
        to: email,
        subject: 'Action needed: OrbitOS payment failed',
        html: `<div style="background:#0a1020;font-family:system-ui,sans-serif;padding:32px;color:#cbd5e1;max-width:520px;margin:0 auto"><div style="color:#38bdf8;font-size:20px;font-weight:700;margin-bottom:16px">◎ OrbitOS</div><h1 style="color:#f87171;font-size:20px;margin-bottom:10px">⚠ Payment failed</h1><p style="color:rgba(148,163,184,0.6);line-height:1.8;margin-bottom:20px">We couldn't process your payment. Please update your payment method to keep Pro access.</p><a href="https://orbitos.pages.dev/dashboard/billing" style="display:block;text-align:center;background:#f87171;color:#fff;padding:12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">Update payment method →</a></div>`,
      })
    }
  }

  return new Response(JSON.stringify({ received:true }), {
    headers:{ 'Content-Type':'application/json' }
  })
}

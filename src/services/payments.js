// src/services/payments.js
// Handles Stripe checkout redirect from the frontend

export async function startCheckout({ plan = 'pro', billing = 'monthly', email }) {
  try {
    const res = await fetch('/api/stripe-checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plan, billing, email }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Checkout failed')
    }

    const { url } = await res.json()

    // Redirect to Stripe hosted checkout page
    window.location.href = url

  } catch (err) {
    console.error('[Payments] Checkout error:', err.message)
    throw err
  }
}

export async function sendConjunctionAlert({ to, alert }) {
  try {
    const res = await fetch('/api/send-alert', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ to, alert }),
    })
    return res.ok
  } catch { return false }
}

export async function submitContactForm({ name, email, organisation, message, plan }) {
  const res = await fetch('/api/contact', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, email, organisation, message, plan }),
  })
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

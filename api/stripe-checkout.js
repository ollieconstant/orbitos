// api/stripe-checkout.js
// Creates a Stripe checkout session when user clicks "Start Pro trial"
// Runs on Vercel serverless — free tier

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY)

  const { plan = 'pro', billing = 'monthly', email } = req.body ?? {}

  const PRICES = {
    pro: {
      monthly:  process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      annual:   process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    },
  }

  const priceId = PRICES[plan]?.[billing]

  if (!priceId) {
    return res.status(400).json({ error: `No price found for plan=${plan} billing=${billing}` })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode:               'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email:     email || undefined,
      success_url:        `${process.env.NEXT_PUBLIC_URL || 'https://orbitos1.vercel.app'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:         `${process.env.NEXT_PUBLIC_URL || 'https://orbitos1.vercel.app'}/pricing`,
      subscription_data: {
        trial_period_days: 14,
        metadata: { plan, billing },
      },
      metadata: { plan, billing },
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[Stripe] Checkout error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

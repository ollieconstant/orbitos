// api/contact.js
// Handles the "Talk to us" / enterprise contact form
// Sends to your email via Resend

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { name, email, organisation, message, plan } = req.body ?? {}

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' })
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    'OrbitOS Contact <hello@orbitos.space>',
        to:      ['hello@orbitos.space'],
        subject: `New enquiry from ${name}${plan ? ` (${plan} plan)` : ''}`,
        html: `
<h2>New OrbitOS enquiry</h2>
<table>
  <tr><td><b>Name</b></td><td>${name}</td></tr>
  <tr><td><b>Email</b></td><td>${email}</td></tr>
  <tr><td><b>Organisation</b></td><td>${organisation || 'Not provided'}</td></tr>
  <tr><td><b>Plan interest</b></td><td>${plan || 'Not specified'}</td></tr>
</table>
<h3>Message</h3>
<p>${message.replace(/\n/g, '<br>')}</p>`,
      }),
    })

    // Auto-reply to sender
    await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    'OrbitOS <hello@orbitos.space>',
        to:      [email],
        subject: "We got your message — we'll be in touch",
        html: `
<!DOCTYPE html><html><body style="background:#0a1020;font-family:system-ui,sans-serif;color:#cbd5e1;margin:0;padding:20px;">
<div style="max-width:480px;margin:0 auto;background:#0f172a;border:1px solid rgba(56,189,248,0.2);border-radius:12px;padding:28px;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
    <span style="font-size:20px;color:#38bdf8;">◎</span>
    <span style="font-weight:700;font-size:16px;color:#38bdf8;">OrbitOS</span>
  </div>
  <h2 style="color:#f1f5f9;font-size:20px;margin:0 0 12px;">Thanks ${name} — we'll be in touch</h2>
  <p style="color:rgba(148,163,184,0.6);line-height:1.8;margin:0 0 20px;">We've received your message and will get back to you within 24 hours.</p>
  <p style="color:rgba(148,163,184,0.6);line-height:1.8;margin:0 0 20px;">In the meantime, feel free to explore OrbitOS — the free plan gives you access to the 3D globe, live tracking, and basic conjunction detection.</p>
  <a href="https://orbitos1.vercel.app" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">Try OrbitOS →</a>
</div>
</body></html>`,
      }),
    })

    return res.status(200).json({ sent: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

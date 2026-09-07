// api/send-alert.js
// Sends conjunction alert emails to Pro users when their watched satellites
// are at risk. Called by the frontend when a risk is detected.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { to, alert } = req.body ?? {}

  if (!to || !alert) {
    return res.status(400).json({ error: 'Missing to or alert fields' })
  }

  const { sat1, sat2, distanceKm, severity, tcaMinutes } = alert
  const sevColor  = severity === 'CRITICAL' ? '#f87171' : '#fb923c'
  const sevBg     = severity === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(251,146,60,0.1)'
  const sevBorder = severity === 'CRITICAL' ? 'rgba(239,68,68,0.25)' : 'rgba(251,146,60,0.25)'

  const html = `
<!DOCTYPE html><html><body style="background:#0a1020;font-family:system-ui,sans-serif;color:#cbd5e1;margin:0;padding:20px;">
<div style="max-width:520px;margin:0 auto;background:#0f172a;border:1px solid ${sevBorder};border-radius:12px;overflow:hidden;">
  <div style="background:#0f172a;padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-size:18px;color:#38bdf8;">◎</span>
      <span style="font-weight:700;color:#38bdf8;">OrbitOS</span>
    </div>
    <span style="font-size:11px;font-weight:600;color:${sevColor};background:${sevBg};border:1px solid ${sevBorder};border-radius:6px;padding:3px 10px;">⚠ ${severity}</span>
  </div>
  <div style="padding:24px;">
    <h1 style="color:#f1f5f9;font-size:20px;margin:0 0 6px;">Conjunction alert</h1>
    <p style="color:rgba(148,163,184,0.5);font-size:13px;margin:0 0 20px;">A satellite on your watchlist has entered a risk corridor</p>
    <div style="background:${sevBg};border:1px solid ${sevBorder};border-radius:8px;padding:16px;text-align:center;margin-bottom:20px;">
      <p style="font-size:18px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">${sat1} × ${sat2}</p>
      <p style="font-size:24px;font-weight:700;color:${sevColor};margin:0 0 4px;">${distanceKm} km</p>
      <p style="font-size:13px;color:rgba(148,163,184,0.5);margin:0;">Time to closest approach: ${tcaMinutes} minutes</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">
      ${[['Object 1',sat1],['Object 2',sat2],['Miss distance',distanceKm+' km'],['Severity',severity]].map(([l,v])=>`
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:10px 12px;">
        <p style="font-size:10px;color:rgba(148,163,184,0.4);text-transform:uppercase;letter-spacing:1px;margin:0 0 3px;">${l}</p>
        <p style="font-size:13px;color:#cbd5e1;font-weight:500;margin:0;">${v}</p>
      </div>`).join('')}
    </div>
    <a href="https://orbitos1.vercel.app" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:12px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;margin-bottom:12px;">View in OrbitOS →</a>
    <p style="font-size:11px;color:rgba(148,163,184,0.25);text-align:center;">You're receiving this because this satellite is on your watchlist. <a href="#" style="color:rgba(148,163,184,0.4);">Manage alerts</a></p>
  </div>
</div>
</body></html>`

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    'OrbitOS Alerts <alerts@orbitos.space>',
        to:      [to],
        subject: `⚠ ${severity}: ${sat1} × ${sat2} — ${distanceKm} km`,
        html,
      }),
    })

    if (!emailRes.ok) {
      const err = await emailRes.text()
      return res.status(502).json({ error: 'Email failed: ' + err })
    }

    return res.status(200).json({ sent: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

// functions/api/send-alert.js — Conjunction alert emails

export async function onRequestPost({ request, env }) {
  const headers = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json' }
  const { to, alert } = await request.json()
  if (!to || !alert) return new Response(JSON.stringify({ error:'Missing fields' }), { status:400, headers })

  const { sat1, sat2, distanceKm, severity, tcaMinutes } = alert
  const sevColor = severity==='CRITICAL' ? '#f87171' : '#fb923c'

  const res = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${env.RESEND_API_KEY}` },
    body:JSON.stringify({
      from:    'OrbitOS Alerts <alerts@orbitos.space>',
      to:      [to],
      subject: `⚠ ${severity}: ${sat1} × ${sat2} — ${distanceKm} km`,
      html:`<div style="background:#0a1020;font-family:system-ui,sans-serif;padding:24px;color:#cbd5e1;max-width:480px;margin:0 auto;border:1px solid ${sevColor}44;border-radius:12px"><div style="color:#38bdf8;font-weight:700;font-size:16px;margin-bottom:14px">◎ OrbitOS</div><h2 style="color:${sevColor};font-size:18px;margin-bottom:8px">⚠ Conjunction Alert — ${severity}</h2><div style="background:${sevColor}18;border:1px solid ${sevColor}44;border-radius:8px;padding:16px;text-align:center;margin-bottom:16px"><div style="font-size:16px;font-weight:700;color:#f1f5f9;margin-bottom:4px">${sat1} × ${sat2}</div><div style="font-size:24px;font-weight:700;color:${sevColor}">${distanceKm} km</div><div style="font-size:12px;color:rgba(148,163,184,0.5);margin-top:4px">Time to closest approach: ${tcaMinutes} minutes</div></div><a href="https://orbitos.pages.dev/app" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:11px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">View in OrbitOS →</a></div>`,
    }),
  })

  return new Response(JSON.stringify({ sent:res.ok }), { headers })
}

export async function onRequestOptions() {
  return new Response(null, { headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } })
}

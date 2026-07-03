// functions/api/contact.js — Enterprise contact form

export async function onRequestPost({ request, env }) {
  const headers = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json' }
  const { name, email, organisation, message, plan } = await request.json()
  if (!name||!email||!message) return new Response(JSON.stringify({ error:'Missing fields' }), { status:400, headers })

  // Send to you
  await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${env.RESEND_API_KEY}` },
    body:JSON.stringify({ from:'OrbitOS Contact <hello@orbitos.space>', to:['hello@orbitos.space'], subject:`New enquiry from ${name}${plan?` (${plan})`:''}`, html:`<h2>New OrbitOS enquiry</h2><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Organisation:</b> ${organisation||'Not provided'}</p><p><b>Plan:</b> ${plan||'Not specified'}</p><h3>Message</h3><p>${message.replace(/\n/g,'<br>')}</p>` }),
  })

  // Auto-reply
  await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${env.RESEND_API_KEY}` },
    body:JSON.stringify({ from:'OrbitOS <hello@orbitos.space>', to:[email], subject:"We got your message — we'll be in touch", html:`<div style="background:#0a1020;font-family:system-ui,sans-serif;padding:28px;color:#cbd5e1;max-width:480px;margin:0 auto;border:1px solid rgba(56,189,248,0.2);border-radius:12px"><div style="color:#38bdf8;font-weight:700;font-size:16px;margin-bottom:16px">◎ OrbitOS</div><h2 style="color:#f1f5f9;font-size:18px;margin-bottom:10px">Thanks ${name} — we'll be in touch</h2><p style="color:rgba(148,163,184,0.6);line-height:1.8;margin-bottom:16px">We've received your message and will get back to you within 24 hours.</p><a href="https://orbitos.pages.dev/app" style="display:block;text-align:center;background:#38bdf8;color:#0f172a;padding:11px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none">Try OrbitOS →</a></div>` }),
  })

  return new Response(JSON.stringify({ sent:true }), { headers })
}

export async function onRequestOptions() {
  return new Response(null, { headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } })
}

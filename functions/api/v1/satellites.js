// functions/api/v1/satellites.js
// Public REST API — requires API key, enforces rate limits

const PLAN_LIMITS = { free:100, pro:10000, enterprise:Infinity }

async function validateKey(authHeader, supabaseUrl, supabaseKey) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const rawKey = authHeader.slice(7)

  // Basic key format validation — must start with orb_
  if (!rawKey.startsWith('orb_')) return null

  // Hash the key before querying
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey))
  const hex  = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')

  const res  = await fetch(`${supabaseUrl}/rest/v1/api_keys?key_hash=eq.${hex}&is_active=eq.true&limit=1`, {
    headers: { 'apikey':supabaseKey, 'Authorization':`Bearer ${supabaseKey}` }
  })
  const data = await res.json()
  return data?.[0] || null
}

async function checkRateLimit(key, supabaseUrl, supabaseKey) {
  const limit    = PLAN_LIMITS[key.plan] || 100
  const hourPast = (Date.now() - new Date(key.hour_reset_at)) > 3_600_000

  if (hourPast) {
    await fetch(`${supabaseUrl}/rest/v1/api_keys?id=eq.${key.id}`, {
      method:  'PATCH',
      headers: { 'apikey':supabaseKey, 'Authorization':`Bearer ${supabaseKey}`, 'Content-Type':'application/json', 'Prefer':'return=minimal' },
      body:    JSON.stringify({ requests_this_hour:1, hour_reset_at:new Date().toISOString() }),
    })
    return { ok:true, remaining:limit-1, limit }
  }

  const remaining = limit - (key.requests_this_hour || 0)
  if (remaining <= 0) return { ok:false, remaining:0, limit }

  await fetch(`${supabaseUrl}/rest/v1/api_keys?id=eq.${key.id}`, {
    method:  'PATCH',
    headers: { 'apikey':supabaseKey, 'Authorization':`Bearer ${supabaseKey}`, 'Content-Type':'application/json', 'Prefer':'return=minimal' },
    body:    JSON.stringify({ requests_this_hour:(key.requests_this_hour||0)+1, requests_total:(key.requests_total||0)+1, last_used_at:new Date().toISOString() }),
  })
  return { ok:true, remaining:remaining-1, limit }
}

export async function onRequestGet({ request, env }) {
  const t0      = Date.now()
  const headers = { 'Content-Type':'application/json' }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error:'Service unavailable' }), { status:503, headers })
  }

  const key = await validateKey(request.headers.get('Authorization'), env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
  if (!key) {
    return new Response(JSON.stringify({ error:'Invalid or missing API key', docs:'https://orbitos-8n5.pages.dev/api' }), { status:401, headers })
  }

  const { ok, remaining, limit } = await checkRateLimit(key, env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
  headers['X-RateLimit-Limit']     = String(limit)
  headers['X-RateLimit-Remaining'] = String(remaining)
  headers['X-RateLimit-Reset']     = String(Math.floor(Date.now()/1000) + 3600)

  if (!ok) {
    return new Response(JSON.stringify({ error:'Rate limit exceeded. Upgrade your plan for more requests.' }), { status:429, headers })
  }

  const url      = new URL(request.url)
  const category = url.searchParams.get('category')
  const maxLimit = key.plan === 'enterprise' ? 50000 : 5000
  const count    = Math.min(parseInt(url.searchParams.get('limit') || '500'), maxLimit)

  let query = `${env.SUPABASE_URL}/rest/v1/tle_records?is_current=eq.true&select=norad_id,name,tle1,tle2,epoch,satellites!inner(category,country)&limit=${count}&order=ingested_at.desc`
  if (category) query += `&satellites.category=eq.${category}`

  const res  = await fetch(query, { headers:{ 'apikey':env.SUPABASE_SERVICE_KEY, 'Authorization':`Bearer ${env.SUPABASE_SERVICE_KEY}` } })
  const data = await res.json()

  // Log usage async
  fetch(`${env.SUPABASE_URL}/rest/v1/api_usage`, {
    method:  'POST',
    headers: { 'apikey':env.SUPABASE_SERVICE_KEY, 'Authorization':`Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type':'application/json', 'Prefer':'return=minimal' },
    body:    JSON.stringify({ api_key_id:key.id, endpoint:'/v1/satellites', method:'GET', status_code:200, response_ms:Date.now()-t0, ip_address:request.headers.get('CF-Connecting-IP') }),
  })

  headers['Cache-Control'] = 's-maxage=60'
  return new Response(JSON.stringify({
    count:      data?.length || 0,
    plan:       key.plan,
    satellites: (data||[]).map(r => ({ id:r.norad_id, name:r.name, category:r.satellites?.category, country:r.satellites?.country, tle1:r.tle1, tle2:r.tle2, epoch:r.epoch })),
  }), { headers })
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, OPTIONS', 'Access-Control-Allow-Headers':'Authorization, Content-Type' }
  })
}

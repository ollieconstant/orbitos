// functions/api/v1/satellites.js — Public REST API for paying customers

async function validateKey(authHeader, supabaseUrl, supabaseKey) {
  if (!authHeader?.startsWith('Bearer ')) return null
  const rawKey = authHeader.slice(7)
  const hash   = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey))
  const hex    = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')

  const res = await fetch(`${supabaseUrl}/rest/v1/api_keys?key_hash=eq.${hex}&is_active=eq.true&limit=1`, {
    headers:{ 'apikey':supabaseKey, 'Authorization':`Bearer ${supabaseKey}` }
  })
  const data = await res.json()
  return data?.[0] || null
}

const LIMITS = { free:100, pro:10000, enterprise:Infinity }

export async function onRequestGet({ request, env }) {
  const start   = Date.now()
  const headers = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json' }

  const key = await validateKey(request.headers.get('Authorization'), env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
  if (!key) return new Response(JSON.stringify({ error:'Invalid API key', docs:'https://orbitos.pages.dev/api' }), { status:401, headers })

  const limit  = LIMITS[key.plan] || 100
  const url    = new URL(request.url)
  const cat    = url.searchParams.get('category')
  const count  = Math.min(parseInt(url.searchParams.get('limit')||'500'), key.plan==='enterprise'?50000:5000)

  let query = `${env.SUPABASE_URL}/rest/v1/tle_records?is_current=eq.true&select=norad_id,name,tle1,tle2,epoch,satellites!inner(category,country)&limit=${count}`
  if (cat) query += `&satellites.category=eq.${cat}`

  const res  = await fetch(query, { headers:{ 'apikey':env.SUPABASE_SERVICE_KEY, 'Authorization':`Bearer ${env.SUPABASE_SERVICE_KEY}` } })
  const data = await res.json()

  // Log usage
  await fetch(`${env.SUPABASE_URL}/rest/v1/api_usage`, {
    method:'POST',
    headers:{ 'apikey':env.SUPABASE_SERVICE_KEY, 'Authorization':`Bearer ${env.SUPABASE_SERVICE_KEY}`, 'Content-Type':'application/json', 'Prefer':'return=minimal' },
    body:JSON.stringify({ api_key_id:key.id, endpoint:'/v1/satellites', method:'GET', status_code:200, response_ms:Date.now()-start }),
  })

  return new Response(JSON.stringify({
    count:data?.length||0,
    plan:key.plan,
    satellites:(data||[]).map(r=>({ id:r.norad_id, name:r.name, category:r.satellites?.category, tle1:r.tle1, tle2:r.tle2, epoch:r.epoch }))
  }), { headers:{ ...headers, 'Cache-Control':'s-maxage=60', 'X-RateLimit-Limit':String(limit) } })
}

export async function onRequestOptions() {
  return new Response(null, { headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, OPTIONS', 'Access-Control-Allow-Headers':'Authorization, Content-Type' } })
}

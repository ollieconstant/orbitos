// functions/api/ingest.js
// Satellite ingestion pipeline — secured with CRON_SECRET
// Only callable by Cloudflare cron or with the correct secret header

export async function onRequestGet({ request, env }) {
  // Verify secret — prevents public triggering
  const auth   = request.headers.get('Authorization')
  const isCron = request.headers.get('X-Cloudflare-Cron') === '1'

  if (!isCron && auth !== `Bearer ${env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status:  401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status:  503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const started = Date.now()
  const results = { fetched: 0, errors: [] }

  const GROUPS = [
    { key:'stations', celestrak:'stations', category:'stations'  },
    { key:'starlink',  celestrak:'starlink',  category:'starlink'  },
    { key:'weather',   celestrak:'weather',   category:'weather'   },
    { key:'science',   celestrak:'science',   category:'science'   },
    { key:'gps-ops',   celestrak:'gps-ops',   category:'nav'       },
    { key:'active',    celestrak:'active',    category:'unknown'   },
  ]

  for (const group of GROUPS) {
    try {
      const tles = await fetchGroup(group, env)
      if (!tles.length) { results.errors.push(`${group.key}: no data`); continue }
      await storeTLEs(tles, group.category, env)
      results.fetched += tles.length
    } catch (err) {
      results.errors.push(`${group.key}: ${err.message}`)
    }
  }

  const duration = Date.now() - started
  const status   = results.errors.length === 0 ? 'success' : results.fetched > 0 ? 'partial' : 'failed'

  // Log to Supabase
  await fetch(`${env.SUPABASE_URL}/rest/v1/ingest_logs`, {
    method: 'POST',
    headers: {
      'apikey':        env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify({
      status, source:'cloudflare-pages', satellites_fetched:results.fetched,
      errors:results.errors, duration_ms:duration,
      started_at:new Date(started).toISOString(), completed_at:new Date().toISOString(),
    }),
  })

  // Alert on failure
  if (status === 'failed' && env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({ from:'OrbitOS <alerts@orbitos.space>', to:['hello@orbitos.space'], subject:'⚠ Ingestion pipeline failed', html:`<pre>${JSON.stringify(results,null,2)}</pre>` }),
    })
  }

  return new Response(JSON.stringify({ status, duration_ms:duration, ...results }), {
    headers: { 'Content-Type':'application/json' },
  })
}

async function fetchGroup(group, env) {
  // Try Space-Track first
  if (env.SPACETRACK_USERNAME && env.SPACETRACK_PASSWORD) {
    try {
      const login = await fetch('https://www.space-track.org/ajaxauth/login', {
        method: 'POST',
        headers: { 'Content-Type':'application/x-www-form-urlencoded' },
        body: `identity=${encodeURIComponent(env.SPACETRACK_USERNAME)}&password=${encodeURIComponent(env.SPACETRACK_PASSWORD)}`,
      })
      if (login.ok) {
        const cookies = login.headers.get('set-cookie')
        const data = await fetch(
          `https://www.space-track.org/basicspacedata/query/class/gp/CONSTELLATION/${group.key.toUpperCase()}/orderby/NORAD_CAT_ID/format/tle`,
          { headers: { 'Cookie': cookies || '' } }
        )
        if (data.ok) {
          const text = await data.text()
          const tles = parseTLE(text, 'spacetrack')
          if (tles.length > 0) return tles
        }
      }
    } catch {}
  }

  // Fallback: Celestrak
  try {
    const res = await fetch(`https://celestrak.org/SATCAT/elements/?GROUP=${group.celestrak}&FORMAT=tle`, {
      headers: { 'User-Agent': 'OrbitOS/1.0 (space-traffic-management)' },
    })
    if (res.ok) {
      const text = await res.text()
      const tles = parseTLE(text, 'celestrak')
      if (tles.length > 0) return tles
    }
  } catch {}

  return []
}

function parseTLE(text, source) {
  const lines  = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  const result = []
  for (let i = 0; i <= lines.length - 3; i += 3) {
    const name = lines[i].replace(/^0 /, '').trim()
    const tle1 = lines[i+1], tle2 = lines[i+2]
    if (!tle1?.startsWith('1 ') || !tle2?.startsWith('2 ')) continue
    if (tle1.length < 68 || tle2.length < 68) continue
    const noradId = parseInt(tle1.slice(2,7).trim(), 10)
    if (isNaN(noradId)) continue
    result.push({ name, tle1, tle2, noradId, source })
  }
  return result
}

function parseEpoch(tle1) {
  try {
    const e = tle1.slice(18,32).trim()
    const yr = parseInt(e.slice(0,2), 10)
    const day = parseFloat(e.slice(2))
    const year = yr >= 57 ? 1900 + yr : 2000 + yr
    const d = new Date(year, 0, 1)
    d.setDate(d.getDate() + day - 1)
    return d.toISOString()
  } catch { return null }
}

async function storeTLEs(tles, category, env) {
  const BATCH = 200
  const headers = {
    'apikey':        env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=minimal',
  }

  for (let i = 0; i < tles.length; i += BATCH) {
    const batch = tles.slice(i, i + BATCH)

    // Upsert satellites
    await fetch(`${env.SUPABASE_URL}/rest/v1/satellites`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(batch.map(t => ({ norad_id:t.noradId, name:t.name, category, is_active:true, updated_at:new Date().toISOString() }))),
    })

    // Mark old TLEs stale
    await fetch(`${env.SUPABASE_URL}/rest/v1/tle_records?is_current=eq.true&norad_id=in.(${batch.map(t=>t.noradId).join(',')})`, {
      method:  'PATCH',
      headers,
      body:    JSON.stringify({ is_current: false }),
    })

    // Insert new TLEs
    const now = new Date().toISOString()
    const rows = batch.map(t => ({ norad_id:t.noradId, name:t.name, tle1:t.tle1, tle2:t.tle2, epoch:parseEpoch(t.tle1), source:t.source, is_current:true, ingested_at:now }))
    await fetch(`${env.SUPABASE_URL}/rest/v1/tle_records`, { method:'POST', headers, body:JSON.stringify(rows) })
    await fetch(`${env.SUPABASE_URL}/rest/v1/tle_history`, { method:'POST', headers, body:JSON.stringify(rows) })
  }
}

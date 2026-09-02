// api/ingest.js — Satellite data ingestion pipeline
// Runs every 6 hours via Vercel cron (vercel.json)
// Also callable manually: GET /api/ingest (with CRON_SECRET header)

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Auth check — allow Vercel cron OR manual trigger with secret
  const auth   = req.headers.authorization
  const secret = process.env.CRON_SECRET
  const isCron = req.headers['x-vercel-cron'] === '1'
  if (secret && !isCron && auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error:'Unauthorized. Pass Authorization: Bearer YOUR_CRON_SECRET' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const started = Date.now()
  const results = { fetched:0, stored:0, errors:[] }

  console.log('[Ingest] Starting pipeline...')

  // Log start
  const { data:log } = await supabase
    .from('ingest_logs')
    .insert({ status:'running', source:'pipeline', started_at:new Date().toISOString() })
    .select('id').single()
  const logId = log?.id

  const GROUPS = [
    { key:'stations', celestrak:'stations', category:'stations', spacetrack:'STATION'  },
    { key:'starlink',  celestrak:'starlink',  category:'starlink', spacetrack:'STARLINK'  },
    { key:'weather',   celestrak:'weather',   category:'weather',  spacetrack:'WEATHER'   },
    { key:'science',   celestrak:'science',   category:'science',  spacetrack:'SCIENCE'   },
    { key:'gps-ops',   celestrak:'gps-ops',   category:'nav',      spacetrack:'GPS-OPS'   },
    { key:'active',    celestrak:'active',    category:'unknown',  spacetrack:null        },
  ]

  for (const group of GROUPS) {
    try {
      const tles = await fetchGroup(group)
      if (!tles.length) { results.errors.push({ group:group.key, error:'No TLEs returned' }); continue }
      await storeTLEs(supabase, tles, group.category)
      results.fetched += tles.length
      results.stored  += tles.length
      console.log(`[Ingest] ${group.key}: ${tles.length} satellites`)
    } catch (err) {
      console.error(`[Ingest] ${group.key} failed:`, err.message)
      results.errors.push({ group:group.key, error:err.message })
    }
  }

  const duration = Date.now() - started
  const status   = results.errors.length === 0 ? 'success' : results.fetched > 0 ? 'partial' : 'failed'

  // Update log
  if (logId) {
    await supabase.from('ingest_logs').update({
      status, satellites_fetched:results.fetched,
      satellites_new:results.stored, errors:results.errors,
      duration_ms:duration, completed_at:new Date().toISOString(),
    }).eq('id', logId)
  }

  // Alert on failure
  if (status === 'failed' && process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${process.env.RESEND_API_KEY}` },
      body:JSON.stringify({ from:'OrbitOS <alerts@orbitos.space>', to:['hello@orbitos.space'], subject:'⚠ Ingestion pipeline failed', html:`<pre>${JSON.stringify(results, null, 2)}</pre>` }),
    })
  }

  console.log(`[Ingest] Done — ${results.fetched} satellites in ${duration}ms`)
  return res.status(200).json({ status, duration_ms:duration, ...results })
}

// ── FETCH ─────────────────────────────────────────────────────
async function fetchGroup(group) {
  // Try Space-Track first (most reliable, no IP blocking)
  if (group.spacetrack && process.env.SPACETRACK_USERNAME && process.env.SPACETRACK_PASSWORD) {
    try {
      const tles = await fetchSpaceTrack(group.spacetrack)
      if (tles.length > 0) { console.log(`[Ingest] Space-Track ${group.key}: ${tles.length}`); return tles }
    } catch (err) { console.warn(`[Ingest] Space-Track failed for ${group.key}:`, err.message) }
  }

  // Fallback: Celestrak
  try {
    const ctrl = new AbortController()
    const t    = setTimeout(() => ctrl.abort(), 12_000)
    const res  = await fetch(`https://celestrak.org/SATCAT/elements/?GROUP=${group.celestrak}&FORMAT=tle`, {
      signal:ctrl.signal, headers:{ 'User-Agent':'OrbitOS/1.0' },
    })
    clearTimeout(t)
    if (res.ok) {
      const text = await res.text()
      const tles = parseTLE(text, 'celestrak')
      if (tles.length > 0) return tles
    }
  } catch (err) { console.warn(`[Ingest] Celestrak failed for ${group.key}:`, err.message) }

  // Fallback: TLE API
  try {
    const SEARCH = { stations:'ISS', starlink:'STARLINK', weather:'NOAA', science:'HUBBLE', 'gps-ops':'GPS', active:'COSMOS' }
    const term   = SEARCH[group.key] || group.key.toUpperCase()
    const res    = await fetch(`https://tle.ivanstanojevic.me/api/tle?search=${term}&page-size=500`)
    if (res.ok) {
      const json    = await res.json()
      const members = json.member || json['hydra:member'] || []
      return members.map(s => ({ name:s.name||s.satelliteName, tle1:s.line1, tle2:s.line2, noradId:s.satelliteId, source:'tle-api' })).filter(s=>s.tle1&&s.tle2)
    }
  } catch (err) { console.warn(`[Ingest] TLE API failed for ${group.key}:`, err.message) }

  return []
}

async function fetchSpaceTrack(groupName) {
  // Login
  const loginRes = await fetch('https://www.space-track.org/ajaxauth/login', {
    method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
    body:`identity=${encodeURIComponent(process.env.SPACETRACK_USERNAME)}&password=${encodeURIComponent(process.env.SPACETRACK_PASSWORD)}`,
  })
  if (!loginRes.ok) throw new Error('Space-Track login failed')
  const cookies = loginRes.headers.get('set-cookie')
  if (!cookies) throw new Error('No cookies from Space-Track')

  // Fetch TLEs
  const dataRes = await fetch(
    `https://www.space-track.org/basicspacedata/query/class/gp/CONSTELLATION/${groupName}/orderby/NORAD_CAT_ID/format/tle`,
    { headers:{ 'Cookie':cookies } }
  )
  if (!dataRes.ok) throw new Error(`Space-Track query ${dataRes.status}`)
  const text = await dataRes.text()
  return parseTLE(text, 'spacetrack')
}

// ── PARSE ─────────────────────────────────────────────────────
function parseTLE(text, source) {
  const lines  = text.trim().split('\n').map(l=>l.trim()).filter(Boolean)
  const result = []
  for (let i = 0; i <= lines.length-3; i+=3) {
    const name = lines[i].replace(/^0 /,'').trim()
    const tle1 = lines[i+1], tle2 = lines[i+2]
    if (!tle1?.startsWith('1 ')||!tle2?.startsWith('2 ')) continue
    if (tle1.length<68||tle2.length<68) continue
    const noradId = parseInt(tle1.slice(2,7).trim(),10)
    if (isNaN(noradId)) continue
    result.push({ name, tle1, tle2, noradId, source })
  }
  return result
}

function parseEpoch(tle1) {
  try {
    const e    = tle1.slice(18,32).trim()
    const yr   = parseInt(e.slice(0,2),10)
    const day  = parseFloat(e.slice(2))
    const year = yr>=57?1900+yr:2000+yr
    const d    = new Date(year,0,1)
    d.setDate(d.getDate()+day-1)
    return d.toISOString()
  } catch { return null }
}

// ── STORE ─────────────────────────────────────────────────────
async function storeTLEs(supabase, tles, category) {
  const BATCH = 200
  for (let i = 0; i < tles.length; i += BATCH) {
    const batch = tles.slice(i, i+BATCH)

    // Upsert satellite master records
    await supabase.from('satellites').upsert(
      batch.map(t => ({ norad_id:t.noradId, name:t.name, category, is_active:true, updated_at:new Date().toISOString() })),
      { onConflict:'norad_id' }
    )

    // Mark old TLEs as not current
    await supabase.from('tle_records')
      .update({ is_current:false })
      .in('norad_id', batch.map(t=>t.noradId))
      .eq('is_current', true)

    // Insert new TLE records
    const now = new Date().toISOString()
    const rows = batch.map(t => ({
      norad_id:    t.noradId,
      name:        t.name,
      tle1:        t.tle1,
      tle2:        t.tle2,
      epoch:       parseEpoch(t.tle1),
      source:      t.source||'unknown',
      is_current:  true,
      ingested_at: now,
    }))

    await supabase.from('tle_records').insert(rows)
    await supabase.from('tle_history').insert(rows)
  }
}

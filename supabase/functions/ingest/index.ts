// supabase/functions/ingest/index.ts
// Supabase Edge Function — replaces Vercel cron job
// Schedule this in Supabase: Dashboard → Edge Functions → Schedule
// Cron: 0 */6 * * * (every 6 hours)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const GROUPS = [
  { key:'stations', celestrak:'stations', category:'stations'  },
  { key:'starlink',  celestrak:'starlink',  category:'starlink'  },
  { key:'weather',   celestrak:'weather',   category:'weather'   },
  { key:'science',   celestrak:'science',   category:'science'   },
  { key:'gps-ops',   celestrak:'gps-ops',   category:'nav'       },
  { key:'active',    celestrak:'active',    category:'unknown'   },
]

async function fetchGroup(group: { key:string, celestrak:string, category:string }) {
  const username = Deno.env.get('SPACETRACK_USERNAME')
  const password = Deno.env.get('SPACETRACK_PASSWORD')

  // Try Space-Track first
  if (username && password) {
    try {
      const login = await fetch('https://www.space-track.org/ajaxauth/login', {
        method:'POST',
        headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
        body:`identity=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      })
      if (login.ok) {
        const cookies = login.headers.get('set-cookie')
        const data = await fetch(
          `https://www.space-track.org/basicspacedata/query/class/gp/CONSTELLATION/${group.key.toUpperCase()}/orderby/NORAD_CAT_ID/format/tle`,
          { headers:{ 'Cookie': cookies || '' } }
        )
        if (data.ok) {
          const text = await data.text()
          const parsed = parseTLE(text, 'spacetrack')
          if (parsed.length > 0) return parsed
        }
      }
    } catch {}
  }

  // Fallback: Celestrak
  try {
    const res = await fetch(`https://celestrak.org/SATCAT/elements/?GROUP=${group.celestrak}&FORMAT=tle`, {
      headers:{ 'User-Agent':'OrbitOS/1.0' }
    })
    if (res.ok) {
      const text = await res.text()
      const parsed = parseTLE(text, 'celestrak')
      if (parsed.length > 0) return parsed
    }
  } catch {}

  return []
}

function parseTLE(text: string, source: string) {
  const lines  = text.trim().split('\n').map((l:string) => l.trim()).filter(Boolean)
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

function parseEpoch(tle1: string) {
  try {
    const e = tle1.slice(18,32).trim()
    const yr = parseInt(e.slice(0,2),10)
    const day = parseFloat(e.slice(2))
    const year = yr>=57?1900+yr:2000+yr
    const d = new Date(year,0,1)
    d.setDate(d.getDate()+day-1)
    return d.toISOString()
  } catch { return null }
}

Deno.serve(async () => {
  const started = Date.now()
  const results = { fetched:0, errors:[] as string[] }

  const { data:log } = await supabase.from('ingest_logs')
    .insert({ status:'running', source:'supabase-edge', started_at:new Date().toISOString() })
    .select('id').single()

  for (const group of GROUPS) {
    try {
      const tles = await fetchGroup(group)
      if (!tles.length) { results.errors.push(`${group.key}: no data`); continue }

      // Batch upsert satellites
      const BATCH = 200
      for (let i = 0; i < tles.length; i += BATCH) {
        const batch = tles.slice(i, i+BATCH)

        await supabase.from('satellites').upsert(
          batch.map((t:any) => ({ norad_id:t.noradId, name:t.name, category:group.category, is_active:true, updated_at:new Date().toISOString() })),
          { onConflict:'norad_id' }
        )

        await supabase.from('tle_records')
          .update({ is_current:false })
          .in('norad_id', batch.map((t:any)=>t.noradId))
          .eq('is_current', true)

        const now = new Date().toISOString()
        const rows = batch.map((t:any) => ({
          norad_id:t.noradId, name:t.name, tle1:t.tle1, tle2:t.tle2,
          epoch:parseEpoch(t.tle1), source:t.source, is_current:true, ingested_at:now,
        }))

        await supabase.from('tle_records').insert(rows)
        await supabase.from('tle_history').insert(rows)
      }

      results.fetched += tles.length
      console.log(`[Ingest] ${group.key}: ${tles.length}`)
    } catch (err:any) {
      results.errors.push(`${group.key}: ${err.message}`)
    }
  }

  const duration = Date.now() - started
  const status   = results.errors.length===0 ? 'success' : results.fetched>0 ? 'partial' : 'failed'

  if (log?.id) {
    await supabase.from('ingest_logs').update({
      status, satellites_fetched:results.fetched, errors:results.errors,
      duration_ms:duration, completed_at:new Date().toISOString(),
    }).eq('id', log.id)
  }

  return new Response(JSON.stringify({ status, duration_ms:duration, ...results }), {
    headers:{ 'Content-Type':'application/json' }
  })
})

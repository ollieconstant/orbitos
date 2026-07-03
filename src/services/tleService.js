// src/services/tleService.js
// Fetches satellite data — tries own DB first, falls back to proxy, then hardcoded sats

export const TLE_CONFIG = {
  groups: [
    { key:'stations', label:'Space Stations', color:'#34d399' },
    { key:'starlink',  label:'Starlink',       color:'#94a3b8' },
    { key:'weather',   label:'Weather',        color:'#38bdf8' },
    { key:'science',   label:'Science',        color:'#a78bfa' },
    { key:'nav',       label:'GPS / Nav',      color:'#fbbf24' },
    { key:'debris',    label:'Debris',         color:'#f87171' },
    { key:'comms',     label:'Comms',          color:'#fb923c' },
  ],
  cacheTTL:  6 * 60 * 60 * 1000,
  cacheKey:  'orbitos_tle_v7',
}

export const FALLBACK_SATS = [
  { id:25544,  name:'ISS',           cat:'stations', color:'#34d399', tle1:'1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9993', tle2:'2 25544  51.6400 338.7573 0007417 286.7697  73.2607 15.49815691  2720' },
  { id:48274,  name:'Tiangong',      cat:'stations', color:'#34d399', tle1:'1 48274U 21035A   24001.50000000  .00016717  00000-0  10270-3 0  9993', tle2:'2 48274  41.4700  18.7573 0007417 286.7697  73.2607 15.59815691  2720' },
  { id:20580,  name:'Hubble',        cat:'science',  color:'#a78bfa', tle1:'1 20580U 90037B   24001.50000000  .00000757  00000-0  36095-4 0  9993', tle2:'2 20580  28.4700  98.7573 0002793 286.7697  73.2607 15.09815691  2720' },
  { id:33591,  name:'NOAA-19',       cat:'weather',  color:'#38bdf8', tle1:'1 33591U 09005A   24001.50000000 -.00000024  00000-0  51522-4 0  9993', tle2:'2 33591  99.1700 158.7573 0013872 286.7697  73.2607 14.12815691  2720' },
  { id:43013,  name:'NOAA-20',       cat:'weather',  color:'#38bdf8', tle1:'1 43013U 17073A   24001.50000000 -.00000034  00000-0  21234-4 0  9993', tle2:'2 43013  98.7000 278.7573 0001234 286.7697  73.2607 14.19215691  2720' },
  { id:44713,  name:'Starlink-1007', cat:'starlink', color:'#94a3b8', tle1:'1 44713U 19074A   24001.50000000  .00001757  00000-0  13522-3 0  9993', tle2:'2 44713  53.0000  38.7573 0001417 286.7697  73.2607 15.06415691  2720' },
  { id:44714,  name:'Starlink-1008', cat:'starlink', color:'#94a3b8', tle1:'1 44714U 19074B   24001.50000000  .00001757  00000-0  13522-3 0  9993', tle2:'2 44714  53.0000  98.7573 0001417 286.7697  73.2607 15.06415691  2720' },
  { id:44715,  name:'Starlink-1009', cat:'starlink', color:'#94a3b8', tle1:'1 44715U 19074C   24001.50000000  .00001757  00000-0  13522-3 0  9993', tle2:'2 44715  53.0000 188.7573 0001417 286.7697  73.2607 15.06415691  2720' },
  { id:35753,  name:'GPS IIF-2',     cat:'nav',      color:'#fbbf24', tle1:'1 35753U 09043A   24001.50000000 -.00000023  00000-0  00000+0 0  9993', tle2:'2 35753  55.0000  38.7573 0094417 286.7697  73.2607  2.00415691  2720' },
  { id:49260,  name:'Landsat-9',     cat:'science',  color:'#a78bfa', tle1:'1 49260U 21088A   24001.50000000 -.00000034  00000-0  21234-4 0  9993', tle2:'2 49260  98.2000 278.7573 0001234 286.7697  73.2607 14.57015691  2720' },
]

function loadCache() {
  try {
    const raw = localStorage.getItem(TLE_CONFIG.cacheKey)
    if (!raw) return null
    const c = JSON.parse(raw)
    if (Date.now() - c.timestamp > TLE_CONFIG.cacheTTL) return null
    if (!c.satellites?.length) return null
    return c
  } catch { return null }
}

function saveCache(satellites) {
  try {
    localStorage.setItem(TLE_CONFIG.cacheKey, JSON.stringify({ timestamp:Date.now(), satellites, version:7 }))
  } catch {}
}

function parseTLEText(text, group) {
  const lines  = text.trim().split('\n').map(l=>l.trim()).filter(Boolean)
  const result = []
  for (let i = 0; i <= lines.length-3; i+=3) {
    const name = lines[i].replace(/^0 /,'').trim()
    const tle1 = lines[i+1], tle2 = lines[i+2]
    if (!tle1?.startsWith('1 ')||!tle2?.startsWith('2 ')) continue
    if (tle1.length<68||tle2.length<68) continue
    const id = parseInt(tle1.slice(2,7).trim(),10)
    if (isNaN(id)) continue
    result.push({ id, name, tle1, tle2, cat:group.key, color:group.color })
  }
  return result
}

export async function fetchAllTLEs({ onProgress=()=>{}, forceRefresh=false } = {}) {
  // 1. Cache
  if (!forceRefresh) {
    const cached = loadCache()
    if (cached) {
      console.log(`[TLE] Cache: ${cached.satellites.length} satellites`)
      return { satellites:cached.satellites, errors:[], fromCache:true, timestamp:cached.timestamp, cacheAgeMs:Date.now()-cached.timestamp }
    }
  }

  const allSats = [], seenIds = new Set(), errors = []

  // 2. Try own Supabase database via /api/satellites
  onProgress({ group:'database', loaded:0, total:1, status:'fetching' })
  try {
    const ctrl = new AbortController()
    const t    = setTimeout(() => ctrl.abort(), 10_000)
    const res  = await fetch('/api/satellites?limit=10000&format=json', { signal:ctrl.signal })
    clearTimeout(t)
    if (res.ok) {
      const json = await res.json()
      if (json.satellites?.length > 10) {
        json.satellites.forEach(sat => {
          if (!seenIds.has(sat.id)) {
            seenIds.add(sat.id)
            allSats.push({
              id:    sat.id,
              name:  sat.name,
              cat:   sat.category || 'unknown',
              color: TLE_CONFIG.groups.find(g=>g.key===sat.category)?.color || '#94a3b8',
              tle1:  sat.tle1,
              tle2:  sat.tle2,
            })
          }
        })
        console.log(`[TLE] Database: ${allSats.length} satellites`)
        onProgress({ group:'database', loaded:1, total:1, status:'done', count:allSats.length })
      }
    }
  } catch (err) {
    console.warn('[TLE] Database fetch failed:', err.message)
    errors.push({ group:'database', error:err.message })
    onProgress({ group:'database', loaded:1, total:1, status:'error' })
  }

  // 3. If DB empty, fall back to Celestrak proxy
  if (allSats.length < 10) {
    console.log('[TLE] Database empty — using Celestrak proxy...')
    for (let i = 0; i < TLE_CONFIG.groups.length; i++) {
      const group = TLE_CONFIG.groups[i]
      onProgress({ group:group.key, loaded:i, total:TLE_CONFIG.groups.length, status:'fetching' })
      try {
        const ctrl = new AbortController()
        const t    = setTimeout(() => ctrl.abort(), 15_000)
        const res  = await fetch(`/api/tle?group=${group.key}`, { signal:ctrl.signal })
        clearTimeout(t)
        if (!res.ok) throw new Error(`${res.status}`)
        const text = await res.text()
        const sats = parseTLEText(text, group)
        sats.forEach(sat => { if (!seenIds.has(sat.id)) { seenIds.add(sat.id); allSats.push(sat) } })
        console.log(`[TLE] Proxy ${group.key}: ${sats.length}`)
        onProgress({ group:group.key, loaded:i+1, total:TLE_CONFIG.groups.length, status:'done', count:sats.length })
      } catch (err) {
        errors.push({ group:group.key, error:err.message })
        onProgress({ group:group.key, loaded:i+1, total:TLE_CONFIG.groups.length, status:'error' })
      }
    }
  }

  // 4. Always add fallback sats
  FALLBACK_SATS.forEach(sat => { if (!seenIds.has(sat.id)) { seenIds.add(sat.id); allSats.push(sat) } })

  console.log(`[TLE] Total: ${allSats.length} satellites`)
  if (allSats.length > FALLBACK_SATS.length) saveCache(allSats)

  return { satellites:allSats, errors, fromCache:false, timestamp:Date.now(), cacheAgeMs:0 }
}

export function getCacheStatus() {
  try {
    const raw = localStorage.getItem(TLE_CONFIG.cacheKey)
    if (!raw) return { exists:false }
    const c   = JSON.parse(raw)
    const age = Date.now() - c.timestamp
    return { exists:true, valid:age<TLE_CONFIG.cacheTTL, ageMs:age, ageHours:+(age/3_600_000).toFixed(2), count:c.satellites?.length||0 }
  } catch { return { exists:false } }
}

export function clearCache() {
  for (let v = 1; v <= 7; v++) {
    try { localStorage.removeItem(`orbitos_tle_v${v}`) } catch {}
  }
}

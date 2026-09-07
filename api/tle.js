// api/tle.js — Vercel serverless proxy
// Switched from Celestrak (blocks cloud IPs) to multiple reliable sources

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { group } = req.query

  // Map group names to search terms for the TLE API
  const SEARCH_TERMS = {
    stations: 'ISS',
    starlink:  'STARLINK',
    weather:   'NOAA',
    science:   'HUBBLE',
    'gps-ops': 'GPS',
  }

  // Also try direct Celestrak URLs with the correct new format
  const CELESTRAK_URLS = {
    stations: 'https://celestrak.org/SATCAT/elements/?GROUP=stations&FORMAT=tle',
    starlink:  'https://celestrak.org/SATCAT/elements/?GROUP=starlink&FORMAT=tle',
    weather:   'https://celestrak.org/SATCAT/elements/?GROUP=weather&FORMAT=tle',
    science:   'https://celestrak.org/SATCAT/elements/?GROUP=science&FORMAT=tle',
    'gps-ops': 'https://celestrak.org/SATCAT/elements/?GROUP=gps-ops&FORMAT=tle',
  }

  if (!SEARCH_TERMS[group]) {
    return res.status(400).json({ error: `Unknown group: ${group}` })
  }

  // Try 1: Celestrak direct
  try {
    const ctrl = new AbortController()
    const t    = setTimeout(() => ctrl.abort(), 8000)
    const r    = await fetch(CELESTRAK_URLS[group], {
      signal:  ctrl.signal,
      headers: { 'User-Agent':'OrbitOS/1.0', 'Accept':'text/plain' },
    })
    clearTimeout(t)
    if (r.ok) {
      const text = await r.text()
      if (text && text.includes('1 ') && text.length > 100) {
        res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=3600')
        res.setHeader('Content-Type', 'text/plain')
        return res.status(200).send(text)
      }
    }
  } catch {}

  // Try 2: TLE API (tle.ivanstanojevic.me) — CORS enabled, very reliable
  try {
    const search = SEARCH_TERMS[group]
    const ctrl   = new AbortController()
    const t      = setTimeout(() => ctrl.abort(), 10000)
    const r      = await fetch(
      `https://tle.ivanstanojevic.me/api/tle?search=${search}&page-size=200`,
      { signal:ctrl.signal, headers:{ 'Accept':'application/json' } }
    )
    clearTimeout(t)

    if (r.ok) {
      const json = await r.json()
      const members = json.member || json['hydra:member'] || []

      if (members.length > 0) {
        // Convert JSON format to TLE text format
        const tleLines = members.map(sat => {
          const name = (sat.name || sat.satelliteName || 'UNKNOWN').padEnd(24).slice(0, 24)
          return `${name}\n${sat.line1}\n${sat.line2}`
        }).join('\n')

        res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=3600')
        res.setHeader('Content-Type', 'text/plain')
        return res.status(200).send(tleLines)
      }
    }
  } catch (err) {
    console.error('[TLE proxy] TLE API failed:', err.message)
  }

  // Try 3: N2YO API alternative
  try {
    const NORAD_IDS = {
      stations: [25544, 48274],       // ISS, Tiangong
      starlink:  [44713, 44714, 44715, 44716, 44717, 49140, 49141, 49142, 49143],
      weather:   [33591, 43013, 37849, 28654],  // NOAA 19, 20, GOES-16, Meteosat
      science:   [20580, 49260, 39634, 27424],  // Hubble, Landsat-9, Sentinel-1A, Aqua
      'gps-ops': [32711, 35752, 40105, 40534, 41019, 43873],
    }
    const ids = NORAD_IDS[group] || []
    const tleLines = []

    for (const id of ids.slice(0, 5)) {
      try {
        const ctrl = new AbortController()
        const t    = setTimeout(() => ctrl.abort(), 5000)
        const r    = await fetch(`https://tle.ivanstanojevic.me/api/tle/${id}`, {
          signal: ctrl.signal,
        })
        clearTimeout(t)
        if (r.ok) {
          const d = await r.json()
          if (d.line1 && d.line2) {
            const name = (d.name || String(id)).padEnd(24).slice(0, 24)
            tleLines.push(`${name}\n${d.line1}\n${d.line2}`)
          }
        }
      } catch {}
    }

    if (tleLines.length > 0) {
      res.setHeader('Cache-Control', 's-maxage=3600')
      res.setHeader('Content-Type', 'text/plain')
      return res.status(200).send(tleLines.join('\n'))
    }
  } catch {}

  return res.status(502).json({
    error: `All sources failed for group: ${group}`,
    group,
  })
}

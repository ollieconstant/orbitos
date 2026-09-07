export async function onRequestGet({ request, env }) {
  const url   = new URL(request.url)
  const group = url.searchParams.get('group')

  // Valid Celestrak group names
  const CELESTRAK = {
    stations: 'https://celestrak.org/SATCAT/elements/?GROUP=stations&FORMAT=tle',
    starlink:  'https://celestrak.org/SATCAT/elements/?GROUP=starlink&FORMAT=tle',
    weather:   'https://celestrak.org/SATCAT/elements/?GROUP=weather&FORMAT=tle',
    science:   'https://celestrak.org/SATCAT/elements/?GROUP=science&FORMAT=tle',
    'gps-ops': 'https://celestrak.org/SATCAT/elements/?GROUP=gps-ops&FORMAT=tle',
    active:    'https://celestrak.org/SATCAT/elements/?GROUP=active&FORMAT=tle',
    // Map frontend group names to valid Celestrak names
    nav:       'https://celestrak.org/SATCAT/elements/?GROUP=gps-ops&FORMAT=tle',
    debris:    'https://celestrak.org/SATCAT/elements/?GROUP=active&FORMAT=tle',
  }

  const SEARCH = {
    stations:'ISS', starlink:'STARLINK', weather:'NOAA',
    science:'HUBBLE', 'gps-ops':'GPS', active:'COSMOS',
    nav:'GPS', debris:'DEB',
  }

  const headers = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'text/plain' }

  if (!group || !CELESTRAK[group]) {
    return new Response(
      JSON.stringify({ error:`Unknown group: ${group}. Valid: stations, starlink, weather, science, gps-ops, nav, debris, active` }),
      { status:400, headers:{ ...headers, 'Content-Type':'application/json' } }
    )
  }

  // Try 1: Celestrak direct
  try {
    const res = await fetch(CELESTRAK[group], {
      headers: { 'User-Agent':'OrbitOS/1.0' },
      cf:      { cacheTtl:7200, cacheEverything:true },
    })
    if (res.ok) {
      const text = await res.text()
      if (text && text.includes('1 ') && text.length > 100) {
        return new Response(text, { headers:{ ...headers, 'Cache-Control':'public, max-age=7200' } })
      }
    }
  } catch {}

  // Try 2: TLE API fallback
  try {
    const term = SEARCH[group] || group.toUpperCase()
    const res  = await fetch(`https://tle.ivanstanojevic.me/api/tle?search=${term}&page-size=500`, {
      headers: { 'Accept':'application/json' }
    })
    if (res.ok) {
      const json    = await res.json()
      const members = json.member || json['hydra:member'] || []
      if (members.length > 0) {
        const text = members
          .filter(s => s.line1 && s.line2)
          .map(s => `${(s.name||'UNKNOWN').padEnd(24).slice(0,24)}\n${s.line1}\n${s.line2}`)
          .join('\n')
        return new Response(text, { headers:{ ...headers, 'Cache-Control':'public, max-age=3600' } })
      }
    }
  } catch {}

  return new Response(
    JSON.stringify({ error:`All sources failed for group: ${group}` }),
    { status:502, headers:{ ...headers, 'Content-Type':'application/json' } }
  )
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, OPTIONS' }
  })
}

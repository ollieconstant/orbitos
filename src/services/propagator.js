// SGP4 orbital mechanics via satellite.js
import * as satellite from 'satellite.js'

export function propagate(tle1, tle2, date = new Date()) {
  try {
    const satrec = satellite.twoline2satrec(tle1, tle2)
    const pv     = satellite.propagate(satrec, date)
    if (!pv.position || typeof pv.position === 'boolean') return null
    const gmst  = satellite.gstime(date)
    const posGd = satellite.eciToGeodetic(pv.position, gmst)
    const vel   = Math.sqrt(pv.velocity.x**2 + pv.velocity.y**2 + pv.velocity.z**2)
    return {
      lat: satellite.degreesLat(posGd.latitude),
      lon: satellite.degreesLong(posGd.longitude),
      alt: posGd.height,
      vel: +vel.toFixed(4),
      eci: pv.position,
    }
  } catch { return null }
}

export function propagateAll(satellites, date = new Date()) {
  return satellites.map(sat => {
    const pos = propagate(sat.tle1, sat.tle2, date)
    return pos ? { ...sat, position:pos } : null
  }).filter(Boolean)
}

export function getOrbitPath(tle1, tle2, steps = 90, startAt = new Date()) {
  try {
    const satrec    = satellite.twoline2satrec(tle1, tle2)
    const periodMin = (2 * Math.PI) / satrec.no
    const stepMs    = (periodMin * 60_000) / steps
    const path      = []
    for (let i = 0; i <= steps; i++) {
      const t   = new Date(startAt.getTime() + i * stepMs)
      const pv  = satellite.propagate(satrec, t)
      if (!pv.position || typeof pv.position === 'boolean') continue
      const gmst  = satellite.gstime(t)
      const posGd = satellite.eciToGeodetic(pv.position, gmst)
      path.push({ lat:satellite.degreesLat(posGd.latitude), lon:satellite.degreesLong(posGd.longitude), alt:posGd.height })
    }
    return path
  } catch { return [] }
}

export function detectConjunctions(satellites, thresholdKm = 5) {
  const t0 = performance.now()
  const risks = [], riskIds = new Set()
  for (let i = 0; i < satellites.length; i++) {
    const a = satellites[i]
    if (!a.position?.eci) continue
    for (let j = i + 1; j < satellites.length; j++) {
      const b = satellites[j]
      if (!b.position?.eci) continue
      const dist = Math.sqrt((a.position.eci.x-b.position.eci.x)**2+(a.position.eci.y-b.position.eci.y)**2+(a.position.eci.z-b.position.eci.z)**2)
      if (dist < thresholdKm) {
        risks.push({ id:`${a.id}-${b.id}`, sat1:a.name, sat2:b.name, distanceKm:+dist.toFixed(3), severity:dist<1?'CRITICAL':'WARNING', timestamp:new Date().toISOString() })
        riskIds.add(String(a.id)); riskIds.add(String(b.id))
      }
    }
  }
  return { risks:risks.sort((a,b)=>a.distanceKm-b.distanceKm), riskIds:[...riskIds], calcMs:+(performance.now()-t0).toFixed(2) }
}

export function getOrbitType(altKm) {
  if (altKm < 2_000)  return { type:'LEO', color:'#00e5ff' }
  if (altKm < 20_000) return { type:'MEO', color:'#ffd84d' }
  if (altKm < 36_100) return { type:'GEO', color:'#ff7733' }
  return                     { type:'HEO', color:'#cc55ff' }
}

export function estimateVelocity(altKm) {
  return +(Math.sqrt(398600.4418 / (6371 + altKm))).toFixed(3)
}

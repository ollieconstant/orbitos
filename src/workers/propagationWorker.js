import * as satellite from 'satellite.js'

self.onmessage = function({ data: { type, payload } }) {
  if (type === 'PROPAGATE')   handlePropagate(payload)
  if (type === 'ORBIT_PATH')  handleOrbitPath(payload)
  if (type === 'PREDICT')     handlePredict(payload)
}

function handlePropagate({ satellites, timestamp, thresholdKm = 5 }) {
  const t0   = performance.now()
  const date = new Date(timestamp ?? Date.now())
  const positions = [], eciMap = {}

  for (const sat of satellites) {
    try {
      const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2)
      const pv     = satellite.propagate(satrec, date)
      if (!pv.position || typeof pv.position === 'boolean') continue
      const gmst  = satellite.gstime(date)
      const posGd = satellite.eciToGeodetic(pv.position, gmst)
      const vel   = Math.sqrt(pv.velocity.x**2 + pv.velocity.y**2 + pv.velocity.z**2)
      positions.push({ id:sat.id, lat:satellite.degreesLat(posGd.latitude), lon:satellite.degreesLong(posGd.longitude), alt:posGd.height, vel:+vel.toFixed(4), eci:pv.position })
      eciMap[sat.id] = { name:sat.name, eci:pv.position }
    } catch { /* skip */ }
  }

  // Collision detection
  const risks = [], riskIds = new Set(), ids = Object.keys(eciMap)
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = eciMap[ids[i]], b = eciMap[ids[j]]
      const dist = Math.sqrt((a.eci.x-b.eci.x)**2+(a.eci.y-b.eci.y)**2+(a.eci.z-b.eci.z)**2)
      if (dist < thresholdKm) {
        risks.push({ sat1:a.name, sat2:b.name, id1:+ids[i], id2:+ids[j], distanceKm:+dist.toFixed(3), severity:dist<1?'CRITICAL':'WARNING', timestamp:date.toISOString() })
        riskIds.add(ids[i]); riskIds.add(ids[j])
      }
    }
  }

  self.postMessage({ type:'RESULT', payload:{ positions, risks:risks.sort((a,b)=>a.distanceKm-b.distanceKm), riskIds:[...riskIds], calcMs:+(performance.now()-t0).toFixed(2), timestamp:date.toISOString(), count:positions.length } })
}

function handleOrbitPath({ sat, steps = 90 }) {
  try {
    const satrec    = satellite.twoline2satrec(sat.tle1, sat.tle2)
    const periodMin = (2 * Math.PI) / satrec.no
    const stepMs    = (periodMin * 60_000) / steps
    const startDate = new Date(), path = []
    for (let i = 0; i <= steps; i++) {
      const t   = new Date(startDate.getTime() + i * stepMs)
      const pv  = satellite.propagate(satrec, t)
      if (!pv.position || typeof pv.position === 'boolean') continue
      const gmst  = satellite.gstime(t)
      const posGd = satellite.eciToGeodetic(pv.position, gmst)
      path.push({ lat:satellite.degreesLat(posGd.latitude), lon:satellite.degreesLong(posGd.longitude), alt:posGd.height })
    }
    self.postMessage({ type:'ORBIT_PATH_RESULT', payload:{ satId:sat.id, path } })
  } catch (err) { self.postMessage({ type:'ERROR', error:err.message }) }
}

function handlePredict({ sat, minutesAhead }) {
  try {
    const satrec     = satellite.twoline2satrec(sat.tle1, sat.tle2)
    const futureDate = new Date(Date.now() + minutesAhead * 60_000)
    const pv         = satellite.propagate(satrec, futureDate)
    if (!pv.position || typeof pv.position === 'boolean') { self.postMessage({ type:'PREDICT_RESULT', payload:{ satId:sat.id, position:null } }); return }
    const gmst  = satellite.gstime(futureDate)
    const posGd = satellite.eciToGeodetic(pv.position, gmst)
    self.postMessage({ type:'PREDICT_RESULT', payload:{ satId:sat.id, position:{ lat:satellite.degreesLat(posGd.latitude), lon:satellite.degreesLong(posGd.longitude), alt:posGd.height, t:futureDate.toISOString() } } })
  } catch (err) { self.postMessage({ type:'ERROR', error:err.message }) }
}

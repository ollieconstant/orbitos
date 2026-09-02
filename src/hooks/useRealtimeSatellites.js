import { useState, useEffect, useRef, useCallback } from 'react'
import * as satellite from 'satellite.js'

// Worker singleton
let workerInstance = null
let workerListeners = []

function getWorker() {
  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL('../workers/propagationWorker.js', import.meta.url),
        { type:'module' }
      )
      workerInstance.onmessage = (e) => workerListeners.forEach(fn => fn(e.data))
      workerInstance.onerror   = ()  => { workerInstance = null }
    } catch { return null }
  }
  return workerInstance
}

// Main-thread fallback
function propagateMainThread(satellites, date) {
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
  const risks = [], riskIds = new Set(), ids = Object.keys(eciMap)
  for (let i = 0; i < ids.length; i++) {
    for (let j = i+1; j < ids.length; j++) {
      const a = eciMap[ids[i]], b = eciMap[ids[j]]
      const dist = Math.sqrt((a.eci.x-b.eci.x)**2+(a.eci.y-b.eci.y)**2+(a.eci.z-b.eci.z)**2)
      if (dist < 5) { risks.push({ sat1:a.name, sat2:b.name, distanceKm:+dist.toFixed(3), severity:dist<1?'CRITICAL':'WARNING' }); riskIds.add(ids[i]); riskIds.add(ids[j]) }
    }
  }
  return { positions, risks, riskIds:[...riskIds], calcMs:0 }
}

export function useRealtimeSatellites(tleData = [], { updateIntervalMs = 5_000, collisionThresholdKm = 5 } = {}) {
  const [satellites,  setSatellites]  = useState([])
  const [risks,       setRisks]       = useState([])
  const [calcMs,      setCalcMs]      = useState(0)
  const [cycleCount,  setCycleCount]  = useState(0)
  const [usingWorker, setUsingWorker] = useState(false)
  const [orbitPaths,  setOrbitPaths]  = useState({})
  const tleRef      = useRef(tleData)
  const intervalRef = useRef(null)
  const listenerRef = useRef(null)

  useEffect(() => { tleRef.current = tleData }, [tleData])

  useEffect(() => {
    const worker = getWorker()
    const handleMessage = (data) => {
      if (data.type === 'RESULT') {
        const { positions, risks, riskIds, calcMs } = data.payload
        const riskSet = new Set(riskIds.map(String))
        const posMap  = Object.fromEntries(positions.map(p => [p.id, p]))
        setSatellites(tleRef.current.map(sat => {
          const pos = posMap[sat.id]
          if (!pos) return null
          return { ...sat, position:{ lat:pos.lat, lon:pos.lon, alt:pos.alt, vel:pos.vel, eci:pos.eci }, risk:riskSet.has(String(sat.id)) }
        }).filter(Boolean))
        setRisks(risks); setCalcMs(calcMs); setCycleCount(c => c+1)
      }
      if (data.type === 'ORBIT_PATH_RESULT') {
        const { satId, path } = data.payload
        setOrbitPaths(prev => ({ ...prev, [satId]:path }))
      }
    }
    if (worker) { setUsingWorker(true); listenerRef.current = handleMessage; workerListeners.push(handleMessage) }
    return () => { if (listenerRef.current) workerListeners = workerListeners.filter(fn => fn !== listenerRef.current) }
  }, [])

  useEffect(() => {
    if (!tleData.length) return
    const doUpdate = () => {
      const worker = getWorker()
      if (worker) {
        worker.postMessage({ type:'PROPAGATE', payload:{ satellites:tleData, timestamp:Date.now(), thresholdKm:collisionThresholdKm } })
      } else {
        const result  = propagateMainThread(tleData, new Date())
        const posMap  = Object.fromEntries(result.positions.map(p => [p.id, p]))
        const riskSet = new Set(result.riskIds.map(String))
        setSatellites(tleData.map(sat => { const pos = posMap[sat.id]; if (!pos) return null; return { ...sat, position:pos, risk:riskSet.has(String(sat.id)) } }).filter(Boolean))
        setRisks(result.risks); setCycleCount(c => c+1)
      }
    }
    doUpdate()
    intervalRef.current = setInterval(doUpdate, updateIntervalMs)
    return () => clearInterval(intervalRef.current)
  }, [tleData, updateIntervalMs, collisionThresholdKm])

  const requestOrbitPath = useCallback((sat, steps = 90) => {
    const worker = getWorker()
    if (worker) worker.postMessage({ type:'ORBIT_PATH', payload:{ sat, steps } })
  }, [])

  const clearOrbitPath = useCallback((satId) => {
    setOrbitPaths(prev => { const next = { ...prev }; delete next[satId]; return next })
  }, [])

  return { satellites, risks, calcMs, cycleCount, usingWorker, orbitPaths, requestOrbitPath, clearOrbitPath }
}

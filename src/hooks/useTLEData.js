import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllTLEs, getCacheStatus, clearCache, TLE_CONFIG } from '../services/tleService'

export function useTLEData({ groups = TLE_CONFIG.groups, autoRefresh = true } = {}) {
  const [satellites,  setSatellites]  = useState([])
  const [errors,      setErrors]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [progress,    setProgress]    = useState({ loaded:0, total:groups.length, currentGroup:null })
  const [fromCache,   setFromCache]   = useState(false)
  const [lastFetch,   setLastFetch]   = useState(null)
  const [cacheStatus, setCacheStatus] = useState(getCacheStatus())
  const timerRef = useRef(null)

  const doFetch = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setProgress({ loaded:0, total:groups.length, currentGroup:null })
    try {
      const result = await fetchAllTLEs({
        groups, forceRefresh,
        onProgress: ({ group, loaded, total, status, count }) =>
          setProgress({ loaded, total, currentGroup:group, status, count }),
      })
      setSatellites(result.satellites)
      setErrors(result.errors)
      setFromCache(result.fromCache)
      setLastFetch(new Date(result.timestamp))
      setCacheStatus(getCacheStatus())
      if (autoRefresh) {
        clearTimeout(timerRef.current)
        const refreshIn = result.fromCache ? TLE_CONFIG.cacheTTL - result.cacheAgeMs : TLE_CONFIG.cacheTTL
        timerRef.current = setTimeout(() => doFetch(true), refreshIn + 5_000)
      }
    } catch (err) {
      setErrors(prev => [...prev, { type:'HOOK_ERROR', detail:err.message }])
    } finally {
      setLoading(false)
    }
  }, [groups, autoRefresh])

  useEffect(() => { doFetch(); return () => clearTimeout(timerRef.current) }, [])

  return {
    satellites, errors, loading, progress, cacheStatus, fromCache, lastFetch,
    refresh:          () => doFetch(false),
    clearAndRefresh:  () => { clearCache(); doFetch(true) },
  }
}

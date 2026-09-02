const CACHE_KEY = 'orbitos_tle_v8'
const CACHE_TTL = 6 * 60 * 60 * 1000

const GROUPS = [
  { key:'stations', label:'Space Stations', color:'#34d399' },
  { key:'starlink',  label:'Starlink',       color:'#94a3b8' },
  { key:'weather',   label:'Weather',        color:'#38bdf8' },
  { key:'science',   label:'Science',        color:'#a78bfa' },
  { key:'nav',       label:'GPS / Nav',      color:'#fbbf24' },
  { key:'debris',    label:'Debris',         color:'#f87171' },
]

const FALLBACK = [
  { id:25544, name:'ISS',          cat:'stations', color:'#34d399', tle1:'1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9993', tle2:'2 25544  51.6400 338.7573 0007417 286.7697  73.2607 15.49815691  2720' },
  { id:48274, name:'Tiangong',     cat:'stations', color:'#34d399', tle1:'1 48274U 21035A   24001.50000000  .00016717  00000-0  10270-3 0  9993', tle2:'2 48274  41.4700  18.7573 0007417 286.7697  73.2607 15.59815691  2720' },
  { id:20580, name:'Hubble',       cat:'science',  color:'#a78bfa', tle1:'1 20580U 90037B   24001.50000000  .00000757  00000-0  36095-4 0  9993', tle2:'2 20580  28.4700  98.7573 0002793 286.7697  73.2607 15.09815691  2720' },
  { id:33591, name:'NOAA-19',      cat:'weather',  color:'#38bdf8', tle1:'1 33591U 09005A   24001.50000000 -.00000024  00000-0  51522-4 0  9993', tle2:'2 33591  99.1700 158.7573 0013872 286.7697  73.2607 14.12815691  2720' },
  { id:43013, name:'NOAA-20',      cat:'weather',  color:'#38bdf8', tle1:'1 43013U 17073A   24001.50000000 -.00000034  00000-0  21234-4 0  9993', tle2:'2 43013  98.7000 278.7573 0001234 286.7697  73.2607 14.19215691  2720' },
  { id:44713, name:'Starlink-1007',cat:'starlink', color:'#94a3b8', tle1:'1 44713U 19074A   24001.50000000  .00001757  00000-0  13522-3 0  9993', tle2:'2 44713  53.0000  38.7573 0001417 286.7697  73.2607 15.06415691  2720' },
  { id:44714, name:'Starlink-1008',cat:'starlink', color:'#94a3b8', tle1:'1 44714U 19074B   24001.50000000  .00001757  00000-0  13522-3 0  9993', tle2:'2 44714  53.0000  98.7573 0001417 286.7697  73.2607 15.06415691  2720' },
  { id:35753, name:'GPS IIF-2',    cat:'nav',      color:'#fbbf24', tle1:'1 35753U 09043A   24001.50000000 -.00000023  00000-0  00000+0 0  9993', tle2:'2 35753  55.0000  38.7573 0094417 286.7697  73.2607  2.00415691  2720' },
  { id:49260, name:'Landsat-9',    cat:'science',  color:'#a78bfa', tle1:'1 49260U 21088A   24001.50000000 -.00000034  00000-0  21234-4 0  9993', tle2:'2 49260  98.2000 278.7573 0001234 286.7697  73.2607 14.57015691  2720' },
]

function parseTLE(text, group) {
  const lines=text.trim().split('\n').map(l=>l.trim()).filter(Boolean), result=[]
  for (let i=0;i<=lines.length-3;i+=3) {
    const name=lines[i].replace(/^0 /,'').trim(), tle1=lines[i+1], tle2=lines[i+2]
    if (!tle1?.startsWith('1 ')||!tle2?.startsWith('2 ')) continue
    if (tle1.length<68||tle2.length<68) continue
    const id=parseInt(tle1.slice(2,7).trim(),10)
    if (isNaN(id)) continue
    result.push({ id, name, tle1, tle2, cat:group.key, color:group.color })
  }
  return result
}

function loadCache() {
  try {
    const raw=localStorage.getItem(CACHE_KEY); if(!raw) return null
    const c=JSON.parse(raw)
    if (Date.now()-c.timestamp>CACHE_TTL||!c.satellites?.length) return null
    return c
  } catch { return null }
}

function saveCache(satellites) {
  try { localStorage.setItem(CACHE_KEY,JSON.stringify({timestamp:Date.now(),satellites,version:8})) } catch {}
}

export async function fetchAllTLEs({ onProgress=()=>{}, forceRefresh=false }={}) {
  if (!forceRefresh) {
    const cached=loadCache()
    if (cached) { console.log('[TLE] Cache:',cached.satellites.length); return {satellites:cached.satellites,errors:[],fromCache:true} }
  }
  const allSats=[], seenIds=new Set(), errors=[]

  // Try own database first
  onProgress({group:'database',status:'fetching'})
  try {
    const res=await fetch('/api/satellites?limit=10000&format=json')
    if (res.ok) {
      const json=await res.json()
      if (json.satellites?.length>10) {
        json.satellites.forEach(sat => {
          if (!seenIds.has(sat.id)) { seenIds.add(sat.id); allSats.push({id:sat.id,name:sat.name,cat:sat.category||'unknown',color:GROUPS.find(g=>g.key===sat.category)?.color||'#94a3b8',tle1:sat.tle1,tle2:sat.tle2}) }
        })
        console.log('[TLE] Database:',allSats.length)
        onProgress({group:'database',status:'done',count:allSats.length})
      }
    }
  } catch (err) { errors.push({group:'database',error:err.message}); onProgress({group:'database',status:'error'}) }

  // Fallback to TLE proxy
  if (allSats.length<10) {
    for (let i=0;i<GROUPS.length;i++) {
      const group=GROUPS[i]
      onProgress({group:group.key,loaded:i,total:GROUPS.length,status:'fetching'})
      try {
        const ctrl=new AbortController(), t=setTimeout(()=>ctrl.abort(),15000)
        const res=await fetch('/api/tle?group='+group.key,{signal:ctrl.signal})
        clearTimeout(t)
        if (!res.ok) throw new Error(res.status)
        const text=await res.text()
        const sats=parseTLE(text,group)
        sats.forEach(s=>{ if(!seenIds.has(s.id)){seenIds.add(s.id);allSats.push(s)} })
        onProgress({group:group.key,loaded:i+1,total:GROUPS.length,status:'done',count:sats.length})
      } catch (err) { errors.push({group:group.key,error:err.message}); onProgress({group:group.key,status:'error'}) }
    }
  }

  // Always add fallbacks
  FALLBACK.forEach(s=>{ if(!seenIds.has(s.id)){seenIds.add(s.id);allSats.push(s)} })
  console.log('[TLE] Total:',allSats.length)
  if (allSats.length>FALLBACK.length) saveCache(allSats)
  return {satellites:allSats,errors,fromCache:false}
}

export function clearCache() { try { localStorage.removeItem(CACHE_KEY) } catch {} }

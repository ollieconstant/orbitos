import { useState, useCallback, useRef } from 'react'
import { useTLEData }            from './hooks/useTLEData'
import { useRealtimeSatellites } from './hooks/useRealtimeSatellites'
import { useAuth, useWatchlist } from './hooks/useAuth'
import Globe                     from './components/Globe'
import MapView2D                 from './components/MapView2D'
import Sidebar                   from './components/Sidebar'
import AuthModal from "./components/AuthModal"
import { SidebarAd, UpgradePrompt, StatusBarAd, LoadingSponsor } from "./components/AdBanner"'

const CAT_CONFIG = {
  stations: { color:'#34d399', label:'Stations',  icon:'🛸' },
  starlink:  { color:'#94a3b8', label:'Starlink',  icon:'📡' },
  weather:   { color:'#38bdf8', label:'Weather',   icon:'🌤' },
  science:   { color:'#a78bfa', label:'Science',   icon:'🔭' },
  nav:       { color:'#fbbf24', label:'GPS / Nav', icon:'🛰' },
  debris:    { color:'#f87171', label:'Debris',    icon:'⚠️' },
  comms:     { color:'#fb923c', label:'Comms',     icon:'📶' },
}
const ALL_CATS = Object.keys(CAT_CONFIG)

function orbitLabel(alt) {
  if (alt < 2000)   return { label:'Low Earth Orbit',    short:'LEO', color:'#38bdf8' }
  if (alt < 20000)  return { label:'Medium Earth Orbit', short:'MEO', color:'#fbbf24' }
  if (alt > 35000)  return { label:'Geostationary',      short:'GEO', color:'#fb923c' }
  return                   { label:'Highly Elliptical',  short:'HEO', color:'#a78bfa' }
}

// ── Reusable DataCell ─────────────────────────────────────────
function DataCell({ label, value, color }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, padding:'7px 9px' }}>
      <div style={{ fontSize:10, color:'rgba(148,163,184,0.4)', fontFamily:'system-ui,sans-serif', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:13, color:color||'#cbd5e1', fontFamily:'system-ui,sans-serif', fontWeight:500 }}>{value}</div>
    </div>
  )
}

// ── Friendly Sidebar ──────────────────────────────────────────
function FriendlySidebar({ satellites, risks, selected, onSelect }) {
  const [query, setQuery] = useState('')
  const riskNames = new Set(risks.flatMap(r => [r.sat1, r.sat2]))
  const filtered  = satellites.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase()) || String(s.id).includes(query)
  )

  return (
    <div style={{ width:260, height:'100%', display:'flex', flexDirection:'column', background:'#0f172a', borderRight:'1px solid rgba(255,255,255,0.07)', fontFamily:'system-ui,sans-serif', flexShrink:0 }}>
      <div style={{ padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(148,163,184,0.35)', fontSize:14 }}>⌕</span>
          <input
            style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:7, padding:'7px 10px 7px 30px', fontSize:13, color:'#cbd5e1', outline:'none', fontFamily:'system-ui,sans-serif' }}
            placeholder="Search satellites…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div style={{ fontSize:11, color:'rgba(148,163,184,0.35)', marginTop:6 }}>
          {filtered.length.toLocaleString()} of {satellites.length.toLocaleString()} visible
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding:24, textAlign:'center', color:'rgba(148,163,184,0.35)', fontSize:13 }}>
            No satellites match "{query}"
          </div>
        )}
        {filtered.slice(0, 100).map(sat => {
          const isRisk = riskNames.has(sat.name)
          const isSel  = selected?.id === sat.id
          const cfg    = CAT_CONFIG[sat.cat] ?? { color:'#38bdf8', label:'Unknown' }
          const alt    = sat.position?.alt ?? sat.alt ?? 0
          return (
            <div key={sat.id} onClick={() => onSelect(isSel ? null : sat)}
              style={{ padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', display:'flex', alignItems:'center', gap:9, background: isSel ? 'rgba(56,189,248,0.07)' : isRisk ? 'rgba(239,68,68,0.06)' : 'transparent', borderLeft:`2px solid ${isSel?'#38bdf8':isRisk?'#f87171':'transparent'}`, transition:'background .1s' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:isRisk?'#f87171':cfg.color, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:isSel?600:400, color:isSel?'#38bdf8':isRisk?'#fca5a5':'#cbd5e1', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sat.name}</div>
                <div style={{ fontSize:11, color:'rgba(148,163,184,0.4)', marginTop:1 }}>{alt.toLocaleString()} km · {cfg.label}</div>
              </div>
              {isRisk && <span style={{ fontSize:11, color:'#f87171', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:4, padding:'1px 5px', flexShrink:0 }}>Risk</span>}
            </div>
          )
        })}
        {filtered.length > 100 && (
          <div style={{ padding:'10px 14px', fontSize:12, color:'rgba(148,163,184,0.35)', textAlign:'center' }}>
            Showing 100 of {filtered.length.toLocaleString()} — use search to narrow down
          </div>
        )}
      </div>

      {risks.length > 0 && (
        <div style={{ borderTop:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.05)', flexShrink:0 }}>
          <div style={{ padding:'8px 12px', fontSize:11, fontWeight:600, color:'#fca5a5', borderBottom:'1px solid rgba(239,68,68,0.15)', display:'flex', justifyContent:'space-between', fontFamily:'system-ui,sans-serif', textTransform:'uppercase', letterSpacing:1 }}>
            <span>⚠ Conjunction alerts</span>
            <span style={{ background:'rgba(239,68,68,0.2)', borderRadius:4, padding:'1px 6px' }}>{risks.length}</span>
          </div>
          {risks.slice(0,5).map((r,i) => (
            <div key={i} style={{ padding:'8px 12px', borderBottom:'1px solid rgba(239,68,68,0.08)' }}>
              <div style={{ fontSize:12, color:'#fca5a5', fontWeight:500, fontFamily:'system-ui,sans-serif' }}>{r.sat1} × {r.sat2}</div>
              <div style={{ fontSize:11, color:'rgba(252,165,165,0.6)', marginTop:2, fontFamily:'system-ui,sans-serif' }}>{r.distanceKm} km apart · {r.severity}</div>
            </div>
          ))}
        </div>
      )}
      {risks.length === 0 && (
        <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,0.06)', fontSize:12, color:'rgba(148,163,184,0.35)', lineHeight:1.5 }}>
          Click any satellite on the globe to inspect it
        </div>
      )}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────
function DashboardView({ satellites, risks, calcMs, cycleCount, usingWorker }) {
  const leo  = satellites.filter(s => (s.position?.alt??0) < 2000).length
  const meo  = satellites.filter(s => { const a=s.position?.alt??0; return a>=2000&&a<36000 }).length
  const geo  = satellites.filter(s => (s.position?.alt??0) >= 36000).length
  const cats = Object.entries(satellites.reduce((acc,s) => { acc[s.cat]=(acc[s.cat]??0)+1; return acc }, {})).sort((a,b)=>b[1]-a[1])
  const maxC = Math.max(...cats.map(c=>c[1]), 1)

  const panels = [
    { title:'Overview', content:(
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[{l:'Total tracked',v:satellites.length.toLocaleString(),c:'#38bdf8'},{l:'LEO objects',v:leo.toLocaleString(),c:'#38bdf8'},{l:'GEO objects',v:geo.toLocaleString(),c:'#fb923c'},{l:'Debris tracked',v:satellites.filter(s=>s.cat==='debris').length.toLocaleString(),c:'#f87171'},{l:'Active risks',v:risks.length,c:risks.length>0?'#f87171':'#34d399'},{l:'Critical risks',v:risks.filter(r=>r.severity==='CRITICAL').length,c:'#f87171'}]
          .map(({l,v,c})=>(
            <div key={l} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:20, fontWeight:700, color:c, fontFamily:'system-ui,sans-serif', lineHeight:1, marginBottom:4 }}>{v}</div>
              <div style={{ fontSize:11, color:'rgba(148,163,184,0.5)', fontFamily:'system-ui,sans-serif' }}>{l}</div>
            </div>
          ))}
      </div>
    )},
    { title:'Objects by type', content:(
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {cats.map(([cat,n])=>(
          <div key={cat} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:12, color:'rgba(148,163,184,0.5)', width:64, textAlign:'right', fontFamily:'system-ui,sans-serif' }}>{CAT_CONFIG[cat]?.label ?? cat}</div>
            <div style={{ flex:1, height:10, background:'rgba(255,255,255,0.05)', borderRadius:3 }}>
              <div style={{ height:'100%', width:`${(n/maxC*100).toFixed(0)}%`, background:(CAT_CONFIG[cat]?.color??'#38bdf8')+'66', borderRight:`2px solid ${CAT_CONFIG[cat]?.color??'#38bdf8'}`, borderRadius:3 }} />
            </div>
            <div style={{ fontSize:12, color:CAT_CONFIG[cat]?.color??'#38bdf8', width:44, textAlign:'right', fontFamily:'system-ui,sans-serif', fontWeight:500 }}>{n.toLocaleString()}</div>
          </div>
        ))}
      </div>
    )},
    { title:'Engine performance', content:(
      <div>
        {[{l:'Propagation time',v:calcMs+'ms'},{l:'Objects tracked',v:satellites.length.toLocaleString()},{l:'Update cycle',v:'#'+cycleCount},{l:'Update interval',v:'5 seconds'},{l:'Algorithm',v:'SGP4 / SDP4'},{l:'Thread mode',v:usingWorker?'Web Worker':'Main thread'},{l:'Coordinate frame',v:'ECI J2000'},{l:'Data source',v:'Celestrak TLE'}]
          .map(({l,v})=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontFamily:'system-ui,sans-serif' }}>
              <span style={{ fontSize:12, color:'rgba(148,163,184,0.45)' }}>{l}</span>
              <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500 }}>{v}</span>
            </div>
          ))}
      </div>
    )},
    { title:'Active conjunctions', content: risks.length===0
      ? <div style={{ padding:'20px 0', textAlign:'center', color:'rgba(148,163,184,0.35)', fontSize:13, fontFamily:'system-ui,sans-serif' }}>All clear — no active risks</div>
      : <div>{risks.slice(0,6).map((r,i)=>(
          <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize:13, color:'#fca5a5', fontWeight:500, fontFamily:'system-ui,sans-serif' }}>{r.sat1} × {r.sat2}</div>
            <div style={{ fontSize:11, color:'rgba(252,165,165,0.5)', marginTop:2, fontFamily:'system-ui,sans-serif' }}>{r.distanceKm} km · {r.severity}</div>
          </div>
        ))}</div>
    },
    { title:'Orbit distribution', content:(
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {[{l:'LEO — below 2,000 km',n:leo,c:'#38bdf8'},{l:'MEO — 2,000 to 36,000 km',n:meo,c:'#fbbf24'},{l:'GEO — above 36,000 km',n:geo,c:'#fb923c'}].map(({l,n,c})=>(
          <div key={l}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4, fontFamily:'system-ui,sans-serif' }}>
              <span style={{ color:'rgba(148,163,184,0.55)' }}>{l}</span>
              <span style={{ color:c, fontWeight:500 }}>{n.toLocaleString()}</span>
            </div>
            <div style={{ height:6, background:'rgba(255,255,255,0.05)', borderRadius:3 }}>
              <div style={{ height:'100%', width:`${satellites.length>0?(n/satellites.length*100).toFixed(0):0}%`, background:c+'44', borderRight:`2px solid ${c}`, borderRadius:3 }} />
            </div>
          </div>
        ))}
      </div>
    )},
    { title:'Recent alerts', content: risks.length===0
      ? <div style={{ padding:'20px 0', textAlign:'center', color:'rgba(148,163,184,0.35)', fontSize:13, fontFamily:'system-ui,sans-serif' }}>No alerts this session</div>
      : <div>{risks.slice(0,5).map((r,i)=>(
          <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontFamily:'system-ui,sans-serif' }}>
            <span style={{ fontSize:12, color:r.severity==='CRITICAL'?'#f87171':'#fb923c' }}>⚠ {r.sat1}</span>
            <span style={{ fontSize:12, color:'rgba(148,163,184,0.4)' }}>{r.distanceKm} km</span>
          </div>
        ))}</div>
    },
  ]

  return (
    <div style={{ width:'100%', height:'100%', background:'#080e1a', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gridTemplateRows:'1fr 1fr', gap:1, padding:16, overflow:'hidden', flex:1 }}>
      {panels.map(({ title, content })=>(
        <div key={title} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:14, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'rgba(148,163,184,0.4)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:12, fontFamily:'system-ui,sans-serif' }}>{title}</div>
          <div style={{ flex:1, overflow:'hidden' }}>{content}</div>
        </div>
      ))}
    </div>
  )
}

// ── API Docs ──────────────────────────────────────────────────
function APIView({ user, onSignIn }) {
  const [activeEp, setActiveEp] = useState(0)
  const EPS = [
    { m:'GET',  p:'/v1/satellites',       d:'All current satellite positions',   t:'Free',       resp:`{\n  "count": 9214,\n  "satellites": [\n    { "id": 25544, "name": "ISS", "lat": 51.62, "alt_km": 408 }\n  ]\n}` },
    { m:'GET',  p:'/v1/conjunctions',     d:'Active conjunction risk events',    t:'Free',       resp:`{\n  "risks": [\n    { "sat1": "DEBRIS-4701", "sat2": "STARLINK-47", "dist_km": 4.2 }\n  ]\n}` },
    { m:'GET',  p:'/v1/satellite/:id',    d:'Single satellite telemetry',        t:'Free',       resp:`{\n  "id": 25544, "name": "ISS",\n  "lat": 51.62, "alt_km": 408, "orbit_type": "LEO"\n}` },
    { m:'GET',  p:'/v1/predict',          d:'Future position forecast (7 days)', t:'Pro',        resp:`{\n  "predictions": [\n    { "t": "2025-06-15T12:00Z", "lat": 42.1, "lon": -12.4 }\n  ]\n}` },
    { m:'POST', p:'/v1/alerts/subscribe', d:'Register webhook for alerts',       t:'Pro',        resp:`{\n  "subscription_id": "sub_abc123",\n  "status": "active"\n}` },
    { m:'GET',  p:'/v1/reentry',          d:'Orbital decay predictions',         t:'Enterprise', resp:`{\n  "objects": [\n    { "name": "DEBRIS-4701", "est_reentry_days": 12 }\n  ]\n}` },
  ]
  const MC = { GET:'#34d399', POST:'#fbbf24' }
  const TC = { Free:'#94a3b8', Pro:'#fbbf24', Enterprise:'#a78bfa' }
  const ep = EPS[activeEp]

  return (
    <div style={{ width:'100%', height:'100%', display:'flex', overflow:'hidden', flex:1, fontFamily:'system-ui,sans-serif' }}>
      <div style={{ width:256, background:'#0f172a', borderRight:'1px solid rgba(255,255,255,0.07)', overflowY:'auto', flexShrink:0 }}>
        <div style={{ padding:'12px 14px', fontSize:11, fontWeight:600, color:'rgba(148,163,184,0.4)', textTransform:'uppercase', letterSpacing:1.5, borderBottom:'1px solid rgba(255,255,255,0.07)' }}>Endpoints</div>
        {EPS.map((e,i)=>(
          <div key={i} onClick={()=>setActiveEp(i)} style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', background:activeEp===i?'rgba(56,189,248,0.07)':'transparent', borderLeft:`2px solid ${activeEp===i?'#38bdf8':'transparent'}`, transition:'background .1s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
              <span style={{ fontSize:11, color:MC[e.m]||'#fff', fontWeight:600 }}>{e.m}</span>
              <span style={{ fontSize:10, color:TC[e.t], background:`${TC[e.t]}18`, borderRadius:3, padding:'1px 6px', border:`1px solid ${TC[e.t]}44` }}>{e.t}</span>
            </div>
            <div style={{ fontSize:12, color:'#94a3b8' }}>{e.p}</div>
            <div style={{ fontSize:11, color:'rgba(148,163,184,0.4)', marginTop:2 }}>{e.d}</div>
          </div>
        ))}
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:24, background:'#080e1a' }}>
        {!user && (
          <div onClick={onSignIn} style={{ padding:'10px 14px', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:8, fontSize:13, color:'#fbbf24', marginBottom:20, cursor:'pointer' }}>
            Sign in to get your API key →
          </div>
        )}
        <div style={{ fontSize:11, color:MC[ep.m]||'#fff', fontWeight:600, marginBottom:4 }}>{ep.m}</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#f1f5f9', letterSpacing:.5, marginBottom:4 }}>{ep.p}</div>
        <div style={{ fontSize:14, color:'rgba(148,163,184,0.6)', marginBottom:16 }}>{ep.d}</div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:TC[ep.t], background:`${TC[ep.t]}18`, border:`1px solid ${TC[ep.t]}44`, borderRadius:6, padding:'4px 12px', marginBottom:20 }}>
          Requires {ep.t} plan
        </div>
        <div style={{ fontSize:11, fontWeight:600, color:'rgba(148,163,184,0.4)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Example request</div>
        <div style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:14, fontSize:12, color:'#94a3b8', lineHeight:1.8, marginBottom:20, fontFamily:'monospace', whiteSpace:'pre' }}>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  https://api.orbitos.space${ep.p}`}</div>
        <div style={{ fontSize:11, fontWeight:600, color:'rgba(148,163,184,0.4)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Response</div>
        <div style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:14, fontSize:12, color:'#94a3b8', lineHeight:1.8, fontFamily:'monospace', whiteSpace:'pre', overflowX:'auto', marginBottom:20 }}>{ep.resp}</div>
        <div style={{ padding:'12px 16px', background:'#0f172a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, fontSize:12, color:'rgba(148,163,184,0.4)' }}>
          Free · 100 req/hr · $0/month{'   ·   '}Pro · 10,000 req/hr · $299/month{'   ·   '}Enterprise · custom
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [view,        setView]        = useState('3d')
  const [simSpeed,    setSimSpeed]    = useState(1)
  const [visibleCats, setVisibleCats] = useState(new Set(ALL_CATS))
  const [selected,    setSelected]    = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showAuth,    setShowAuth]    = useState(false)
  const viewerRef = useRef(null)

  const { satellites:tleData, loading, progress, fromCache, cacheStatus, clearAndRefresh } = useTLEData()
  const { satellites, risks, calcMs, cycleCount, usingWorker, orbitPaths, requestOrbitPath, clearOrbitPath } = useRealtimeSatellites(tleData, { updateIntervalMs:5_000 })
  const { user }                                  = useAuth()
  const { watchlist, add:wlAdd, remove:wlRemove } = useWatchlist(user?.id)

  const visibleSats = satellites.filter(s => visibleCats.has(s.cat))
  const critRisks   = risks.filter(r => r.severity === 'CRITICAL')

  const handleSelect = useCallback((sat) => {
    if (selected && !sat) clearOrbitPath(selected.id)
    setSelected(sat)
    if (sat) requestOrbitPath(sat)
  }, [selected, requestOrbitPath, clearOrbitPath])

  const toggleCat = (cat) => setVisibleCats(p => {
    const n = new Set(p); n.has(cat) ? n.delete(cat) : n.add(cat); return n
  })

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    const pct = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0
    return (
      <div style={{ position:'fixed', inset:0, background:'#0a1020', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:999, fontFamily:'system-ui,sans-serif' }}>
        <div style={{ fontSize:36, marginBottom:8 }}>◎</div>
        <div style={{ fontSize:24, fontWeight:700, color:'#f1f5f9', marginBottom:4 }}>OrbitOS</div>
        <div style={{ fontSize:14, color:'rgba(148,163,184,0.5)', marginBottom:36 }}>Space traffic management</div>
        <div style={{ width:280, height:3, background:'rgba(255,255,255,0.08)', borderRadius:2, marginBottom:14, overflow:'hidden' }}>
          <div style={{ height:'100%', width:pct+'%', background:'#38bdf8', borderRadius:2, transition:'width .3s ease' }} />
        </div>
        <div style={{ fontSize:13, color:'rgba(148,163,184,0.5)' }}>
          {progress.currentGroup ? `Loading ${progress.currentGroup} satellites — ${pct}%` : 'Connecting to Celestrak…'}
        </div>
        <div style={{ fontSize:12, color:'rgba(148,163,184,0.3)', marginTop:6 }}>
          {fromCache ? `Using cached data · ${cacheStatus.ageHours}h old` : 'Fetching live data'}
        </div>
      </div>
    )
  }

  // ── Full app ──────────────────────────────────────────────
  return (
    <div style={{ width:'100vw', height:'100vh', display:'flex', flexDirection:'column', background:'#0a1020', overflow:'hidden' }}>

      {showAuth && <AuthModal user={user} onClose={() => setShowAuth(false)} />}

      {/* Nav */}
      <div style={{ height:52, background:'#0f172a', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', flexShrink:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 20px', borderRight:'1px solid rgba(255,255,255,0.08)', height:'100%' }}>
          <span style={{ fontSize:22, color:'#38bdf8' }}>◎</span>
          <div>
            <div style={{ color:'#38bdf8', fontWeight:700, fontSize:15, letterSpacing:1, fontFamily:'system-ui,sans-serif' }}>OrbitOS</div>
            <div style={{ color:'rgba(148,163,184,0.4)', fontSize:11, fontFamily:'system-ui,sans-serif' }}>Space Traffic</div>
          </div>
        </div>

        <div style={{ display:'flex', height:'100%', marginLeft:4 }}>
          {[['3d','3D Globe'],['2d','2D Map'],['dashboard','Dashboard'],['api','API']].map(([v,label]) => (
            <button key={v} onClick={() => setView(v)} style={{ height:'100%', padding:'0 18px', fontSize:13, fontWeight:view===v?600:400, color:view===v?'#38bdf8':'rgba(148,163,184,0.55)', background:'transparent', border:'none', borderBottom:`2px solid ${view===v?'#38bdf8':'transparent'}`, cursor:'pointer', fontFamily:'system-ui,sans-serif', transition:'all .15s' }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', height:'100%' }}>
          {[
            { l:'Tracked', v:visibleSats.length.toLocaleString(), c:'#38bdf8' },
            { l:'Risks',   v:risks.length,  c:risks.length>0?'#f87171':'#34d399' },
            { l:'Cycle',   v:'#'+cycleCount, c:'#64748b' },
          ].map(({l,v,c}) => (
            <div key={l} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 14px', borderLeft:'1px solid rgba(255,255,255,0.07)', height:'100%' }}>
              <span style={{ fontSize:16, fontWeight:700, color:c, fontFamily:'system-ui,sans-serif', lineHeight:1 }}>{v}</span>
              <span style={{ fontSize:10, color:'rgba(148,163,184,0.4)', marginTop:3, fontFamily:'system-ui,sans-serif', textTransform:'uppercase', letterSpacing:1 }}>{l}</span>
            </div>
          ))}

          <div style={{ display:'flex', height:'100%', borderLeft:'1px solid rgba(255,255,255,0.07)' }}>
            {[1,5,20,60].map(s => (
              <button key={s} onClick={() => setSimSpeed(s)} style={{ width:38, height:'100%', border:'none', borderRight:'1px solid rgba(255,255,255,0.06)', background:simSpeed===s?'rgba(56,189,248,0.12)':'transparent', color:simSpeed===s?'#38bdf8':'rgba(148,163,184,0.4)', fontFamily:'system-ui,sans-serif', fontSize:12, fontWeight:simSpeed===s?600:400, cursor:'pointer', transition:'all .15s' }}>{s}×</button>
            ))}
          </div>

          <button onClick={() => setSidebarOpen(p=>!p)} aria-label="Toggle sidebar" style={{ width:44, height:'100%', border:'none', background:'transparent', color:'rgba(148,163,184,0.5)', fontSize:18, cursor:'pointer', borderLeft:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>☰</button>
          <div onClick={() => setShowAuth(true)} role="button" tabIndex={0} style={{ display:'flex', alignItems:'center', gap:8, padding:'0 16px', borderLeft:'1px solid rgba(255,255,255,0.07)', height:'100%', cursor:'pointer' }}>
            <div style={{ width:26, height:26, borderRadius:'50%', background:user?'rgba(56,189,248,0.2)':'rgba(255,255,255,0.07)', border:`1px solid ${user?'#38bdf8':'rgba(255,255,255,0.15)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:user?'#38bdf8':'rgba(148,163,184,0.4)', fontFamily:'system-ui,sans-serif' }}>
              {user ? user.email[0].toUpperCase() : '?'}
            </div>
            <span style={{ fontSize:12, color:user?'#38bdf8':'rgba(148,163,184,0.35)', fontFamily:'system-ui,sans-serif' }}>{user ? user.email.split('@')[0] : 'Sign in'}</span>
          </div>
        </div>
      </div>

      {/* Conjunction banner */}
      {critRisks.length > 0 && (
        <div style={{ background:'rgba(239,68,68,0.12)', borderBottom:'1px solid rgba(239,68,68,0.25)', padding:'6px 20px', fontSize:13, color:'#fca5a5', fontFamily:'system-ui,sans-serif', display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <span>⚠</span>
          <span style={{ fontWeight:600 }}>{critRisks.length} critical conjunction{critRisks.length>1?'s':''} detected</span>
          <span style={{ opacity:.6 }}>—</span>
          <span style={{ opacity:.75 }}>{critRisks.slice(0,2).map(r=>`${r.sat1} × ${r.sat2}`).join(', ')}</span>
        </div>
      )}

      {/* Body */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {sidebarOpen && (view==='3d'||view==='2d') && (
          <FriendlySidebar satellites={visibleSats} risks={risks} selected={selected} onSelect={handleSelect} />
        )}

        <div style={{ flex:1, position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>

          {(view==='3d'||view==='2d') && (
            <>
              {view==='3d' && <Globe satellites={visibleSats} selected={selected} onSelectSat={handleSelect} onViewerReady={v=>{ viewerRef.current=v }} orbitPaths={orbitPaths} />}
              {view==='2d' && <MapView2D satellites={visibleSats} selected={selected} onSelect={handleSelect} />}

              {/* Category bar */}
              <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)', display:'flex', gap:4, background:'rgba(15,23,42,0.85)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'5px 8px', zIndex:10 }}>
                {ALL_CATS.map(cat => {
                  const on = visibleCats.has(cat)
                  return (
                    <button key={cat} onClick={() => toggleCat(cat)} title={`Toggle ${CAT_CONFIG[cat].label}`}
                      style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, padding:'4px 10px', borderRadius:6, border:`1px solid ${on?CAT_CONFIG[cat].color+'66':'transparent'}`, background:on?CAT_CONFIG[cat].color+'18':'transparent', color:on?CAT_CONFIG[cat].color:'rgba(148,163,184,0.4)', cursor:'pointer', fontFamily:'system-ui,sans-serif', fontWeight:on?500:400, transition:'all .15s', opacity:on?1:.6 }}>
                      <span style={{ fontSize:11 }}>{CAT_CONFIG[cat].icon}</span>
                      <span>{CAT_CONFIG[cat].label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div style={{ position:'absolute', bottom:30, left:12, background:'rgba(15,23,42,0.85)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 12px', zIndex:10 }}>
                <div style={{ fontSize:10, fontWeight:600, color:'rgba(148,163,184,0.4)', textTransform:'uppercase', letterSpacing:1, marginBottom:7, fontFamily:'system-ui,sans-serif' }}>Satellite types</div>
                {ALL_CATS.map(cat => (
                  <div key={cat} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4, fontSize:12, color:'rgba(148,163,184,0.65)', fontFamily:'system-ui,sans-serif' }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:CAT_CONFIG[cat].color, flexShrink:0 }} />
                    {CAT_CONFIG[cat].label}
                  </div>
                ))}
              </div>

              {/* Ticker */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, height:26, background:'rgba(15,23,42,0.92)', borderTop:'1px solid rgba(255,255,255,0.07)', overflow:'hidden', zIndex:10 }}>
                <div style={{ display:'flex', whiteSpace:'nowrap', animation:'tickscroll 50s linear infinite', fontSize:11, color:'rgba(148,163,184,0.3)', lineHeight:'26px', fontFamily:'system-ui,sans-serif' }}>
                  {[...Array(2)].flatMap(() => ['ISS · 408 km · 7.66 km/s','Starlink constellation · 550 km LEO','NOAA-19 · sun-synchronous · 870 km','Hubble Space Telescope · 537 km','Tiangong Space Station · 390 km','27,000+ objects tracked in real time','GPS constellation · 20,200 km MEO','Sentinel-1A · SAR imaging · 693 km'].map((t,i) => <span key={i} style={{ padding:'0 28px' }}>· {t}</span>))}
                </div>
                <style>{`@keyframes tickscroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }`}</style>
              </div>
            </>
          )}

          {view==='dashboard' && <DashboardView satellites={satellites} risks={risks} calcMs={calcMs} cycleCount={cycleCount} usingWorker={usingWorker} />}
          {view==='api'       && <APIView user={user} onSignIn={() => setShowAuth(true)} />}
        </div>

        {/* Inspect panel */}
        {selected && (
          <div style={{ width:260, background:'#0f172a', borderLeft:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden' }}>
            <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:CAT_CONFIG[selected.cat]?.color||'#38bdf8', fontFamily:'system-ui,sans-serif', marginBottom:2 }}>{selected.name}</div>
                  <div style={{ fontSize:11, color:'rgba(148,163,184,0.45)', fontFamily:'system-ui,sans-serif' }}>{CAT_CONFIG[selected.cat]?.label} · #{selected.id}</div>
                </div>
                <button onClick={() => handleSelect(null)} style={{ background:'none', border:'none', color:'rgba(148,163,184,0.35)', cursor:'pointer', fontSize:18, lineHeight:1, padding:4 }}>✕</button>
              </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:14 }}>
              <div style={{ fontSize:10, fontWeight:600, color:'rgba(148,163,184,0.4)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8, fontFamily:'system-ui,sans-serif' }}>Live position</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, marginBottom:14 }}>
                <DataCell label="Latitude"  value={selected.position?.lat!=null ? selected.position.lat.toFixed(3)+'°' : '—'} />
                <DataCell label="Longitude" value={selected.position?.lon!=null ? selected.position.lon.toFixed(3)+'°' : '—'} />
                <DataCell label="Altitude"  value={(selected.position?.alt ?? selected.alt ?? '?').toLocaleString()+' km'} color={CAT_CONFIG[selected.cat]?.color} />
                <DataCell label="Velocity"  value={selected.position?.vel!=null ? selected.position.vel.toFixed(2)+' km/s' : '—'} color="#34d399" />
              </div>

              <div style={{ fontSize:10, fontWeight:600, color:'rgba(148,163,184,0.4)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8, fontFamily:'system-ui,sans-serif' }}>Orbital elements</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, marginBottom:14 }}>
                <DataCell label="Inclination" value={selected.inc+'°'} />
                <DataCell label="Period"       value={selected.period+' min'} />
                <DataCell label="NORAD ID"     value={'#'+selected.id} />
                <DataCell label="Orbit type"   value={orbitLabel(selected.position?.alt ?? selected.alt ?? 0).short} color={orbitLabel(selected.position?.alt ?? selected.alt ?? 0).color} />
              </div>

              <div style={{ fontSize:10, fontWeight:600, color:'rgba(148,163,184,0.4)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8, fontFamily:'system-ui,sans-serif' }}>Tags</div>
              <div style={{ marginBottom:14, display:'flex', flexWrap:'wrap', gap:4 }}>
                {(() => {
                  const ot = orbitLabel(selected.position?.alt ?? selected.alt ?? 0)
                  const isRisk = risks.some(r => r.sat1===selected.name || r.sat2===selected.name)
                  const inWL   = watchlist.some(w => w.satellite_id===selected.id)
                  return <>
                    <span style={{ fontSize:11, padding:'3px 8px', borderRadius:4, border:`1px solid ${ot.color}44`, color:ot.color, fontFamily:'system-ui,sans-serif' }}>{ot.label}</span>
                    {selected.inc > 80   && <span style={{ fontSize:11, padding:'3px 8px', borderRadius:4, border:'1px solid rgba(167,139,250,0.4)', color:'#a78bfa', fontFamily:'system-ui,sans-serif' }}>Polar orbit</span>}
                    {isRisk              && <span style={{ fontSize:11, padding:'3px 8px', borderRadius:4, border:'1px solid rgba(248,113,113,0.4)', color:'#f87171', background:'rgba(248,113,113,0.1)', fontFamily:'system-ui,sans-serif' }}>⚠ Conjunction risk</span>}
                    {inWL                && <span style={{ fontSize:11, padding:'3px 8px', borderRadius:4, border:'1px solid rgba(52,211,153,0.4)', color:'#34d399', fontFamily:'system-ui,sans-serif' }}>On watchlist</span>}
                  </>
                })()}
              </div>

              <div style={{ fontSize:10, fontWeight:600, color:'rgba(148,163,184,0.4)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:8, fontFamily:'system-ui,sans-serif' }}>Actions</div>
              <button onClick={() => orbitPaths[selected.id] ? clearOrbitPath(selected.id) : requestOrbitPath(selected)}
                style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'system-ui,sans-serif', marginBottom:7, background:orbitPaths[selected.id]?'rgba(56,189,248,0.18)':'rgba(56,189,248,0.08)', border:`1px solid ${orbitPaths[selected.id]?'rgba(56,189,248,0.5)':'rgba(56,189,248,0.25)'}`, color:'#38bdf8', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {orbitPaths[selected.id] ? '✕ Hide orbit path' : '◎ Show orbit path'}
              </button>
              <button onClick={() => watchlist.some(w=>w.satellite_id===selected.id) ? wlRemove(selected.id) : wlAdd(selected)}
                style={{ width:'100%', padding:'9px 12px', borderRadius:7, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'system-ui,sans-serif', background:watchlist.some(w=>w.satellite_id===selected.id)?'rgba(52,211,153,0.1)':'transparent', border:`1px solid ${watchlist.some(w=>w.satellite_id===selected.id)?'rgba(52,211,153,0.3)':'rgba(255,255,255,0.1)'}`, color:watchlist.some(w=>w.satellite_id===selected.id)?'#34d399':'rgba(148,163,184,0.5)', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {watchlist.some(w=>w.satellite_id===selected.id) ? '✓ On your watchlist' : '+ Add to watchlist'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ height:26, borderTop:'1px solid rgba(255,255,255,0.07)', background:'#0a1020', display:'flex', alignItems:'center', padding:'0 16px', gap:16, fontSize:11, color:'rgba(148,163,184,0.35)', fontFamily:'system-ui,sans-serif', flexShrink:0 }}>
        <span style={{ color:'#34d399' }}>● Live</span>
        <span>{usingWorker ? 'Web Worker' : 'Main thread'} · SGP4</span>
        <span style={{ flex:1, overflow:'hidden', whiteSpace:'nowrap' }}>
          {satellites.length.toLocaleString()} satellites · {calcMs}ms propagation ·{' '}
          {fromCache ? `cached (${cacheStatus.ageHours}h old)` : 'live from Celestrak'}
        </span>
        <button onClick={clearAndRefresh} style={{ padding:'2px 10px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(148,163,184,0.45)', fontFamily:'system-ui,sans-serif', fontSize:11, cursor:'pointer', borderRadius:4 }}>
          ↺ Refresh
        </button>
      </div>
    </div>
  )
}

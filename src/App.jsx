import React, { useState, useEffect } from 'react'
import Globe from './components/Globe.jsx'
import MapView2D from './components/MapView2D.jsx'
import Sidebar from './components/Sidebar.jsx'
import AuthModal from './components/AuthModal.jsx'
import { StatusBarAd, LoadingSponsor } from './components/AdBanner.jsx'
import { fetchAllTLEs } from './services/tleService.js'
import { useAuth } from './hooks/useAuth.js'

const CAT_CONFIG = {
  stations: { color: '#34d399', label: 'Stations' },
  starlink:  { color: '#94a3b8', label: 'Starlink' },
  weather:   { color: '#38bdf8', label: 'Weather'  },
  science:   { color: '#a78bfa', label: 'Science'  },
  nav:       { color: '#fbbf24', label: 'GPS'      },
  debris:    { color: '#f87171', label: 'Debris'   },
  comms:     { color: '#fb923c', label: 'Comms'    },
  unknown:   { color: '#64748b', label: 'Unknown'  },
}

const M = 'system-ui,-apple-system,sans-serif'

function propagate(sat, now) {
  try {
    if (!window.satellite || !sat.tle1 || !sat.tle2) return null
    const satrec = window.satellite.twoline2satrec(sat.tle1, sat.tle2)
    const date   = new Date(now)
    const pv     = window.satellite.propagate(satrec, date)
    if (!pv || !pv.position) return null
    const gmst   = window.satellite.gstime(date)
    const geo    = window.satellite.eciToGeodetic(pv.position, gmst)
    return {
      lat: window.satellite.degreesLat(geo.latitude),
      lon: window.satellite.degreesLong(geo.longitude),
      alt: geo.height,
    }
  } catch (e) { return null }
}

export default function App() {
  const { user } = useAuth()
  const isPro = false

  const [view,       setView]       = useState('3d')
  const [satellites, setSatellites] = useState([])
  const [positions,  setPositions]  = useState({})
  const [selected,   setSelected]   = useState(null)
  const [risks,      setRisks]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [loadMsg,    setLoadMsg]    = useState('Loading...')
  const [showAuth,   setShowAuth]   = useState(false)
  const [satReady,   setSatReady]   = useState(false)

  useEffect(() => {
    const check = () => window.satellite ? setSatReady(true) : setTimeout(check, 300)
    check()
  }, [])

  useEffect(() => {
    fetchAllTLEs({
      onProgress: (p) => {
        if (p.status === 'fetching') setLoadMsg('Fetching ' + p.group + '...')
        if (p.status === 'done')    setLoadMsg('Loaded ' + p.group)
      },
    }).then((r) => { setSatellites(r.satellites); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!satReady || !satellites.length) return
    const run = () => {
      const now  = Date.now()
      const pos  = {}
      const found = []
      satellites.forEach(s => { const p = propagate(s, now); if (p) pos[s.id] = p })
      const list = satellites.filter(s => pos[s.id]).slice(0, 150)
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = pos[list[i].id], b = pos[list[j].id]
          const dx = (a.lon - b.lon) * 111 * Math.cos(a.lat * Math.PI / 180)
          const dy = (a.lat - b.lat) * 111
          const dz = a.alt - b.alt
          const d  = Math.sqrt(dx*dx + dy*dy + dz*dz)
          if (d < 10) found.push({ sat1: list[i].name, sat2: list[j].name, distanceKm: d.toFixed(1), severity: d < 5 ? 'CRITICAL' : 'WARNING' })
        }
      }
      setPositions(pos)
      setRisks(found.slice(0, 10))
    }
    run()
    const iv = setInterval(run, 5000)
    return () => clearInterval(iv)
  }, [satReady, satellites])

  const sats = satellites.map(s => ({
    ...s,
    position: positions[s.id] || null,
    risk:     risks.some(r => r.sat1 === s.name || r.sat2 === s.name),
    color:    (CAT_CONFIG[s.cat] || CAT_CONFIG.unknown).color,
  }))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#030810', fontFamily:M, overflow:'hidden' }}>

      {/* Nav */}
      <div style={{ height:44, background:'#0f172a', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', padding:'0 14px', gap:10, flexShrink:0 }}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <span style={{ fontSize:18, color:'#38bdf8' }}>◎</span>
          <span style={{ color:'#38bdf8', fontWeight:700, fontSize:14 }}>OrbitOS</span>
        </a>
        <div style={{ width:1, height:20, background:'rgba(255,255,255,0.1)', margin:'0 4px' }} />
        <div style={{ display:'flex', gap:2, background:'rgba(255,255,255,0.05)', borderRadius:7, padding:3 }}>
          {[['3d','3D Globe'],['2d','2D Map']].map(([v,l]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding:'4px 12px', borderRadius:5, border:'none', background:view===v?'rgba(56,189,248,0.15)':'transparent', color:view===v?'#38bdf8':'rgba(148,163,184,0.5)', fontFamily:M, fontSize:12, fontWeight:view===v?600:400, cursor:'pointer' }}>{l}</button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'rgba(148,163,184,0.4)' }}>{sats.length.toLocaleString()} satellites</span>
          {risks.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:6, padding:'3px 10px' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#f87171', display:'inline-block' }} />
              <span style={{ fontSize:11, color:'#f87171', fontWeight:600 }}>{risks.length} risk{risks.length>1?'s':''}</span>
            </div>
          )}
          {!isPro && <StatusBarAd />}
          <button onClick={() => setShowAuth(true)} style={{ padding:'5px 12px', background:user?'rgba(52,211,153,0.1)':'rgba(56,189,248,0.1)', border:'1px solid '+(user?'rgba(52,211,153,0.25)':'rgba(56,189,248,0.25)'), borderRadius:7, color:user?'#34d399':'#38bdf8', fontFamily:M, fontSize:12, fontWeight:600, cursor:'pointer' }}>
            {user ? user.email.split('@')[0] : 'Sign in'}
          </button>
          <a href="/pricing" style={{ padding:'5px 12px', background:'#38bdf8', color:'#0f172a', borderRadius:7, fontSize:12, fontWeight:700, textDecoration:'none' }}>{isPro?'Pro':'Upgrade'}</a>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        <Sidebar satellites={sats} risks={risks} selected={selected} onSelect={setSelected} isPro={isPro} />
        <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
          {loading ? (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#030810', gap:16 }}>
              <span style={{ fontSize:32, color:'#38bdf8' }}>◎</span>
              <div style={{ fontSize:13, color:'rgba(148,163,184,0.5)' }}>{loadMsg}</div>
              {!isPro && <LoadingSponsor />}
            </div>
          ) : view === '3d' ? (
            <Globe satellites={sats} selected={selected} onSelectSat={setSelected} />
          ) : (
            <MapView2D satellites={sats} selected={selected} onSelect={setSelected} isPro={isPro} />
          )}
          {selected && (
            <div style={{ position:'absolute', top:12, right:12, width:240, background:'rgba(15,23,42,0.95)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:10, padding:16, backdropFilter:'blur(8px)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', marginBottom:2 }}>{selected.name}</div>
                  <div style={{ fontSize:11, color:(CAT_CONFIG[selected.cat]||CAT_CONFIG.unknown).color }}>
                    {(CAT_CONFIG[selected.cat]||CAT_CONFIG.unknown).label} · NORAD {selected.id}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'rgba(148,163,184,0.4)', cursor:'pointer', fontSize:16 }}>✕</button>
              </div>
              {selected.position ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[['Latitude',selected.position.lat.toFixed(2)+'°'],['Longitude',selected.position.lon.toFixed(2)+'°'],['Altitude',Math.round(selected.position.alt).toLocaleString()+' km'],['Status',selected.risk?'⚠ Risk':'✓ Clear']].map(([l,v]) => (
                    <div key={l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:6, padding:'8px 10px' }}>
                      <div style={{ fontSize:10, color:'rgba(148,163,184,0.4)', textTransform:'uppercase', letterSpacing:.5, marginBottom:3 }}>{l}</div>
                      <div style={{ fontSize:13, color:l==='Status'&&selected.risk?'#f87171':'#cbd5e1', fontWeight:500 }}>{v}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize:12, color:'rgba(148,163,184,0.4)' }}>Computing position...</div>
              )}
              {!isPro && (
                <a href="/pricing" style={{ display:'block', marginTop:12, padding:'7px', textAlign:'center', background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:6, fontSize:11, color:'#38bdf8', textDecoration:'none', fontWeight:600 }}>Upgrade for alerts →</a>
              )}
            </div>
          )}
        </div>
      </div>

      {showAuth && <AuthModal user={user} onClose={() => setShowAuth(false)} />}
    </div>
  )
}

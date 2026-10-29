import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Globe from './Globe.jsx'
import MapView2D from './MapView2D.jsx'
import Sidebar from './Sidebar.jsx'
import AuthModal from './AuthModal.jsx'
import CookieBanner, { useCookieConsent } from './CookieBanner.jsx'
import { StatusBarAd, LoadingSponsor } from './AdBanner.jsx'
import { fetchAllTLEs } from './tleService.js'
import { useAuth } from './useAuth.js'
import { Logo } from './site.jsx'
import { C, SANS, MONO, CAT, catOf } from './theme.js'

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

const regime = alt => alt == null ? '—' : alt < 2000 ? 'LEO' : Math.abs(alt - 35786) < 600 ? 'GEO' : alt < 35286 ? 'MEO' : 'HEO'
const fmtLat = v => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? 'N' : 'S'}`
const fmtLon = v => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? 'E' : 'W'}`

const CSS = `
.oa{position:fixed;inset:0;display:flex;flex-direction:column;background:${C.bg};color:${C.fg};font-family:${SANS};overflow:hidden;-webkit-font-smoothing:antialiased}
.oa *{box-sizing:border-box}
.oa a{color:inherit;text-decoration:none}
.oa-mono{font-family:${MONO};font-size:10.5px;letter-spacing:.14em;text-transform:uppercase}
.oa-dim{color:${C.dim}}.oa-mut{color:${C.mut}}

/* top bar */
.oa-top{height:52px;flex-shrink:0;display:flex;align-items:center;gap:18px;padding:0 14px 0 18px;border-bottom:1px solid ${C.line};background:${C.bg};position:relative;z-index:20}
.oa-logo{display:flex;align-items:center;gap:10px;font-weight:600;letter-spacing:.32em;font-size:12px}
.oa-sep{width:1px;height:20px;background:${C.line2}}
.oa-seg{display:flex;border:1px solid ${C.line2}}
.oa-seg button{height:30px;padding:0 14px;background:transparent;border:0;color:${C.mut};cursor:pointer;font-family:${MONO};font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;transition:background .15s,color .15s}
.oa-seg button+button{border-left:1px solid ${C.line2}}
.oa-seg button:hover{color:${C.fg}}
.oa-seg button.on{background:${C.fg};color:${C.bg}}
.oa-right{margin-left:auto;display:flex;align-items:center;gap:16px}
.oa-stat{display:flex;gap:8px;align-items:center;color:${C.dim};white-space:nowrap}
.oa-stat b{color:${C.fg};font-weight:400}
.oa-live{width:6px;height:6px;border-radius:50%;background:${C.live};animation:oaPulse 2s infinite}
@keyframes oaPulse{0%{box-shadow:0 0 0 0 rgba(125,211,252,.55)}70%{box-shadow:0 0 0 8px rgba(125,211,252,0)}100%{box-shadow:0 0 0 0 rgba(125,211,252,0)}}
.oa-risk{display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;color:${C.sig};border:1px solid rgba(255,90,31,.45);background:rgba(255,90,31,.06)}
.oa-risk i{width:6px;height:6px;background:${C.sig};display:block}
.oa-btn{height:32px;padding:0 14px;display:inline-flex;align-items:center;gap:8px;border:1px solid ${C.fg};background:transparent;color:${C.fg};cursor:pointer;font-family:${MONO};font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;transition:background .15s,color .15s,border-color .15s}
.oa-btn.pri{background:${C.fg};color:${C.bg}}.oa-btn.pri:hover{background:transparent;color:${C.fg}}
.oa-btn.sec{border-color:${C.line2}}.oa-btn.sec:hover{border-color:${C.fg}}
.oa-btn.user{border-color:rgba(125,211,252,.4);color:${C.live}}
.oa-listbtn{display:none}

/* body */
.oa-body{flex:1;display:flex;min-height:0;position:relative}
.oa-view{flex:1;position:relative;overflow:hidden;background:${C.bg}}
.oa-corner{position:absolute;width:16px;height:16px;border:0 solid ${C.line2};pointer-events:none;z-index:5}
.oa-hud{position:absolute;pointer-events:none;z-index:5;line-height:1.9}
.oa-hud b{font-weight:400;color:${C.mut}}

/* loading */
.oa-load{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:${C.bg}}
.oa-load svg{color:${C.fg};animation:oaSpin 6s linear infinite}
@keyframes oaSpin{to{transform:rotate(360deg)}}
.oa-bar{width:220px;height:1px;background:${C.line2};overflow:hidden;position:relative}
.oa-bar::after{content:'';position:absolute;top:0;left:-30%;width:30%;height:1px;background:${C.fg};animation:oaRun 1.4s ease-in-out infinite}
@keyframes oaRun{to{left:100%}}

/* selected panel */
.oa-panel{position:absolute;top:16px;right:16px;width:300px;background:rgba(10,11,13,.94);border:1px solid ${C.line2};backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:10}
.oa-panel-hd{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid ${C.line}}
.oa-x{background:none;border:0;color:${C.mut};cursor:pointer;font-size:18px;line-height:1;padding:0 2px}.oa-x:hover{color:${C.fg}}
.oa-panel h2{font-size:22px;font-weight:500;letter-spacing:-.025em;margin:0;line-height:1.15;padding:18px 16px 6px;word-break:break-word}
.oa-cat{display:flex;align-items:center;gap:8px;padding:0 16px 18px}
.oa-cat i{width:7px;height:7px;display:block}
.oa-cells{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid ${C.line}}
.oa-cell{padding:14px 16px;border-bottom:1px solid ${C.line}}
.oa-cell:nth-child(odd){border-right:1px solid ${C.line}}
.oa-cell .v{font-size:17px;letter-spacing:-.01em;margin-top:6px;font-variant-numeric:tabular-nums}
.oa-cell.full{grid-column:1/-1;border-right:0}
.oa-status{display:flex;align-items:center;gap:8px;margin-top:8px;font-family:${MONO};font-size:11px;letter-spacing:.12em}
.oa-panel .oa-btn{margin:14px 16px 16px;width:calc(100% - 32px);justify-content:center}

/* sidebar */
.oa-side{width:304px;flex-shrink:0;display:flex;flex-direction:column;background:${C.bg};border-right:1px solid ${C.line};min-height:0;z-index:15}
.oa-side-hd{padding:16px 16px 12px;border-bottom:1px solid ${C.line}}
.oa-side-row{display:flex;justify-content:space-between;align-items:baseline}
.oa-search{position:relative;margin-top:12px}
.oa-search input{width:100%;height:36px;background:${C.bg2};border:1px solid ${C.line2};padding:0 12px 0 32px;color:${C.fg};font-family:${MONO};font-size:12px;outline:none;border-radius:0}
.oa-search input::placeholder{color:${C.dim};letter-spacing:.08em}
.oa-search input:focus{border-color:${C.fg}}
.oa-search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:${C.dim}}
.oa-cats{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid ${C.line}}
.oa-chip{display:flex;align-items:center;gap:8px;padding:9px 16px;background:none;border:0;border-bottom:1px solid ${C.line};color:${C.mut};cursor:pointer;text-align:left;font-family:${MONO};font-size:10px;letter-spacing:.1em;text-transform:uppercase;transition:color .15s,opacity .15s}
.oa-chip:nth-child(odd){border-right:1px solid ${C.line}}
.oa-chip:nth-last-child(-n+2){border-bottom:0}
.oa-chip:hover{color:${C.fg}}
.oa-chip i{width:7px;height:7px;display:block;flex-shrink:0}
.oa-chip span{margin-left:auto;color:${C.dim}}
.oa-chip.off{opacity:.35}
.oa-list{flex:1;overflow-y:auto;min-height:0}
.oa-list::-webkit-scrollbar{width:4px}.oa-list::-webkit-scrollbar-thumb{background:${C.line2}}
.oa-row{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.04);border-left:2px solid transparent;cursor:pointer;transition:background .12s}
.oa-row:hover{background:${C.bg2}}
.oa-row.sel{background:${C.bg3};border-left-color:${C.fg}}
.oa-row.risk{border-left-color:${C.sig}}
.oa-row i{width:6px;height:6px;display:block;flex-shrink:0}
.oa-row .nm{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oa-row .sub{margin-top:3px;font-size:10px}
.oa-tag{margin-left:auto;flex-shrink:0;color:${C.sig};border:1px solid rgba(255,90,31,.45);padding:2px 6px;font-size:9.5px}
.oa-more{padding:14px 16px;text-align:center}
.oa-conj{border-top:1px solid rgba(255,90,31,.35);flex-shrink:0;max-height:34%;overflow-y:auto}
.oa-conj-hd{display:flex;justify-content:space-between;padding:10px 16px;color:${C.sig};border-bottom:1px solid rgba(255,90,31,.2);background:rgba(255,90,31,.05)}
.oa-conj-row{padding:10px 16px;border-bottom:1px solid ${C.line}}
.oa-conj-row .nm{font-size:13px}
.oa-conj-row .sub{margin-top:3px;font-size:10px}
.oa-scrim{display:none}

@media (max-width:900px){
  .oa-stat.hide-md,.oa-sponsor{display:none}
}
@media (max-width:760px){
  .oa-top{gap:10px;padding:0 10px 0 12px}
  .oa-logo span,.oa-sep,.oa-stat,.oa-btn.sec.hide-sm{display:none}
  .oa-listbtn{display:inline-flex}
  .oa-side{position:absolute;left:0;top:0;bottom:0;width:min(86vw,320px);transform:translateX(-100%);transition:transform .25s;z-index:30}
  .oa-side.open{transform:none}
  .oa-scrim{display:block;position:absolute;inset:0;background:rgba(0,0,0,.55);z-index:25}
  .oa-panel{left:12px;right:12px;top:auto;bottom:12px;width:auto}
  .oa-risk span{display:none}
  .oa-hud{display:none}
}
`

export default function App() {
  const { user } = useAuth()
  const isPro = false
  const { consent, accept, decline, hasChosen } = useCookieConsent()
  const [view,       setView]       = useState('3d')
  const [satellites, setSatellites] = useState([])
  const [positions,  setPositions]  = useState({})
  const [selected,   setSelected]   = useState(null)
  const [risks,      setRisks]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [loadMsg,    setLoadMsg]    = useState('Connecting to catalogue')
  const [showAuth,   setShowAuth]   = useState(false)
  const [satReady,   setSatReady]   = useState(false)
  const [hidden,     setHidden]     = useState(() => new Set())
  const [listOpen,   setListOpen]   = useState(false)

  useEffect(() => {
    const check = () => window.satellite ? setSatReady(true) : setTimeout(check, 300)
    check()
  }, [])

  useEffect(() => {
    fetchAllTLEs({
      onProgress: (p) => {
        if (p.status === 'fetching') setLoadMsg('Fetching ' + p.group)
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

  const sats = useMemo(() => satellites.map(s => ({
    ...s,
    cat:      CAT[s.cat] ? s.cat : 'unknown',
    position: positions[s.id] || null,
    risk:     risks.some(r => r.sat1 === s.name || r.sat2 === s.name),
    color:    catOf(s.cat).color,
  })), [satellites, positions, risks])

  const shown = useMemo(() => hidden.size ? sats.filter(s => !hidden.has(s.cat)) : sats, [sats, hidden])

  // Keep the selected panel in sync with fresh positions
  const sel = selected ? sats.find(s => s.id === selected.id) || selected : null

  const toggleCat = cat => setHidden(h => { const n = new Set(h); n.has(cat) ? n.delete(cat) : n.add(cat); return n })
  const pick = useCallback(s => { setSelected(s); if (s) setListOpen(false) }, [])

  return (
    <div className="oa">
      <style>{CSS}</style>

      {/* Top bar */}
      <header className="oa-top">
        <button className="oa-btn sec oa-listbtn" onClick={() => setListOpen(o => !o)} aria-label="Toggle catalogue">List</button>
        <a href="/" className="oa-logo"><Logo size={20} /><span>ORBITOS</span></a>
        <div className="oa-sep" />
        <div className="oa-seg" role="tablist">
          {[['3d','3D Globe'],['2d','2D Map']].map(([v,l]) => (
            <button key={v} className={view === v ? 'on' : undefined} onClick={() => setView(v)} role="tab" aria-selected={view === v}>{l}</button>
          ))}
        </div>
        <div className="oa-right">
          <div className="oa-stat oa-mono"><span className="oa-live" /><b>{sats.length.toLocaleString()}</b> objects</div>
          {risks.length > 0 && (
            <div className="oa-risk oa-mono"><i />{risks.length}<span>&nbsp;conjunction{risks.length > 1 ? 's' : ''}</span></div>
          )}
          {!isPro && <span className="oa-sponsor"><StatusBarAd /></span>}
          <button className={'oa-btn ' + (user ? 'user' : 'sec hide-sm')} onClick={() => setShowAuth(true)}>
            {user ? user.email.split('@')[0] : 'Sign in'}
          </button>
          <a href="/pricing" className="oa-btn pri">{isPro ? 'Pro' : 'Upgrade'}</a>
        </div>
      </header>

      {/* Body */}
      <div className="oa-body">
        {listOpen && <div className="oa-scrim" onClick={() => setListOpen(false)} />}
        <Sidebar satellites={sats} risks={risks} selected={sel} onSelect={pick} isPro={isPro} hidden={hidden} onToggleCat={toggleCat} open={listOpen} />

        <main className="oa-view">
          {loading ? (
            <div className="oa-load">
              <Logo size={44} />
                            <div className="oa-bar" />
              <div className="oa-mono oa-dim">{loadMsg}</div>
              {!isPro && <LoadingSponsor />}
            </div>
          ) : view === '3d' ? (
            <Globe satellites={shown} selected={sel} onSelectSat={pick} />
          ) : (
            <MapView2D satellites={shown} selected={sel} onSelect={pick} isPro={isPro} />
          )}


          {sel && (
            <section className="oa-panel" aria-label="Selected object">
              <div className="oa-panel-hd">
                <span className="oa-mono oa-dim">NORAD {sel.id}</span>
                <button className="oa-x" onClick={() => setSelected(null)} aria-label="Close">×</button>
              </div>
              <h2>{sel.name}</h2>
              <div className="oa-cat oa-mono oa-mut"><i style={{ background: catOf(sel.cat).color }} />{catOf(sel.cat).label}</div>
              {sel.position ? (
                <div className="oa-cells">
                  {[['Latitude', fmtLat(sel.position.lat)], ['Longitude', fmtLon(sel.position.lon)], ['Altitude', Math.round(sel.position.alt).toLocaleString() + ' km'], ['Regime', regime(sel.position.alt)]].map(([l, v]) => (
                    <div className="oa-cell" key={l}><div className="oa-mono oa-dim">{l}</div><div className="v">{v}</div></div>
                  ))}
                  <div className="oa-cell full">
                    <div className="oa-mono oa-dim">Status</div>
                    <div className="oa-status" style={{ color: sel.risk ? C.sig : C.live }}>
                      <i style={{ width: 6, height: 6, background: sel.risk ? C.sig : C.live, display: 'block' }} />
                      {sel.risk ? 'CONJUNCTION RISK' : 'CLEAR'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="oa-mono oa-dim" style={{ padding: '0 16px 16px' }}>Computing position…</div>
              )}
              {!isPro && <a href="/pricing" className="oa-btn sec">Get alerts for this object →</a>}
            </section>
          )}
        </main>
      </div>

      {showAuth && <AuthModal user={user} onClose={() => setShowAuth(false)} />}
      {!hasChosen && <CookieBanner onAccept={accept} onDecline={decline} />}
    </div>
  )
}

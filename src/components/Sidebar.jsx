import { useState, useMemo } from 'react'
import { SidebarAd, UpgradePrompt } from './AdBanner'

const CAT_COLORS = {
  stations:'#34d399', starlink:'#94a3b8', weather:'#38bdf8',
  science:'#a78bfa', nav:'#fbbf24', debris:'#f87171', comms:'#fb923c',
}
const CAT_LABELS = {
  stations:'Stations', starlink:'Starlink', weather:'Weather',
  science:'Science', nav:'GPS / Nav', debris:'Debris', comms:'Comms',
}
const M = 'system-ui,-apple-system,sans-serif'

export default function Sidebar({ satellites=[], risks=[], selected, onSelect, isPro=false }) {
  const [query, setQuery] = useState('')
  const riskNames = useMemo(() => new Set(risks.flatMap(r => [r.sat1, r.sat2])), [risks])

  const filtered = useMemo(() => satellites.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase()) || String(s.id).includes(query)
  ), [satellites, query])

  return (
    <div style={{ width:260, height:'100%', display:'flex', flexDirection:'column', background:'#0f172a', borderRight:'1px solid rgba(255,255,255,0.07)', fontFamily:M, flexShrink:0 }}>

      {/* Search */}
      <div style={{ padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'rgba(148,163,184,0.35)', fontSize:14, pointerEvents:'none' }}>⌕</span>
          <input
            style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:7, padding:'7px 10px 7px 30px', fontSize:13, color:'#cbd5e1', outline:'none', fontFamily:M }}
            placeholder="Search satellites…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div style={{ fontSize:11, color:'rgba(148,163,184,0.35)', marginTop:5 }}>
          {filtered.length.toLocaleString()} of {satellites.length.toLocaleString()} satellites
        </div>
      </div>

      {/* Satellite list */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding:24, textAlign:'center', color:'rgba(148,163,184,0.35)', fontSize:13 }}>
            No satellites match "{query}"
          </div>
        )}
        {filtered.slice(0, 120).map(sat => {
          const isRisk = riskNames.has(sat.name)
          const isSel  = selected?.id === sat.id
          const col    = isRisk ? '#f87171' : (CAT_COLORS[sat.cat] ?? '#38bdf8')
          const alt    = sat.position?.alt ?? sat.alt ?? 0
          return (
            <div key={sat.id}
              onClick={() => onSelect(isSel ? null : sat)}
              style={{ padding:'7px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', display:'flex', alignItems:'center', gap:8, background: isSel ? 'rgba(56,189,248,0.07)' : isRisk ? 'rgba(239,68,68,0.06)' : 'transparent', borderLeft:`2px solid ${isSel?'#38bdf8':isRisk?'#f87171':'transparent'}`, transition:'background .1s' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:col, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:isSel?600:400, color:isSel?'#38bdf8':isRisk?'#fca5a5':'#cbd5e1', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sat.name}</div>
                <div style={{ fontSize:11, color:'rgba(148,163,184,0.4)', marginTop:1 }}>{Math.round(alt).toLocaleString()} km · {CAT_LABELS[sat.cat] ?? sat.cat}</div>
              </div>
              {isRisk && <span style={{ fontSize:10, color:'#f87171', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:4, padding:'1px 5px', flexShrink:0 }}>Risk</span>}
            </div>
          )
        })}
        {filtered.length > 120 && (
          <div style={{ padding:'10px 14px', fontSize:12, color:'rgba(148,163,184,0.35)', textAlign:'center' }}>
            Showing 120 of {filtered.length.toLocaleString()} — use search to narrow down
          </div>
        )}
      </div>

      {/* Conjunction risks */}
      {risks.length > 0 && (
        <div style={{ borderTop:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.05)', flexShrink:0 }}>
          <div style={{ padding:'7px 12px', fontSize:11, fontWeight:600, color:'#fca5a5', borderBottom:'1px solid rgba(239,68,68,0.15)', display:'flex', justifyContent:'space-between', textTransform:'uppercase', letterSpacing:.8 }}>
            <span>⚠ Conjunction alerts</span>
            <span style={{ background:'rgba(239,68,68,0.2)', borderRadius:4, padding:'1px 6px' }}>{risks.length}</span>
          </div>
          {risks.slice(0, 4).map((r, i) => (
            <div key={i} style={{ padding:'7px 12px', borderBottom:'1px solid rgba(239,68,68,0.08)' }}>
              <div style={{ fontSize:12, color:'#fca5a5', fontWeight:500 }}>{r.sat1} × {r.sat2}</div>
              <div style={{ fontSize:11, color:'rgba(252,165,165,0.55)', marginTop:2 }}>{r.distanceKm} km apart · {r.severity}</div>
            </div>
          ))}
        </div>
      )}

      {/* Ad slot (free tier only) */}
      {!isPro && <SidebarAd />}

      {/* Upgrade prompt (free tier) */}
      {!isPro && (
        <UpgradePrompt onUpgrade={() => window.location.href = '/pricing'} />
      )}

      {/* Hint (pro tier) */}
      {isPro && risks.length === 0 && (
        <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.06)', fontSize:12, color:'rgba(148,163,184,0.3)', lineHeight:1.5 }}>
          Click any satellite to inspect it
        </div>
      )}
    </div>
  )
}

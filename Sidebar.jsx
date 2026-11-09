import { useState, useMemo } from 'react'
import { SidebarAd, UpgradePrompt } from './AdBanner.jsx'
import { CAT, catOf } from './theme.js'

const LIMIT = 150

export default function Sidebar({ satellites = [], risks = [], fmtTca = x => x, selected, onSelect, isPro = false, hidden = new Set(), onToggleCat, open = false }) {
  const [query, setQuery] = useState('')
  const riskIds = useMemo(() => new Set(risks.flatMap(r => [r.id1, r.id2])), [risks])
  const byId = useMemo(() => new Map(satellites.map(s => [s.id, s])), [satellites])

  const counts = useMemo(() => {
    const c = {}
    satellites.forEach(s => { c[s.cat] = (c[s.cat] || 0) + 1 })
    return c
  }, [satellites])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return satellites.filter(s =>
      !hidden.has(s.cat) &&
      (!q || s.name.toLowerCase().includes(q) || String(s.id).includes(q)))
  }, [satellites, query, hidden])

  // Conjunction objects first, then the rest
  const ordered = useMemo(() => {
    if (!riskIds.size) return filtered
    return [...filtered].sort((a, b) => (riskIds.has(b.id) ? 1 : 0) - (riskIds.has(a.id) ? 1 : 0))
  }, [filtered, riskIds])

  const cats = Object.keys(CAT).filter(k => counts[k])

  return (
    <aside className={'oa-side' + (open ? ' open' : '')} aria-label="Satellite catalogue">
      <div className="oa-side-hd">
        <div className="oa-side-row">
          <span className="oa-mono oa-mut">Catalogue</span>
          <span className="oa-mono oa-dim">{filtered.length.toLocaleString()} / {satellites.length.toLocaleString()}</span>
        </div>
        <div className="oa-search">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5" /><path d="m11 11 4 4" /></svg>
          <input placeholder="NAME OR NORAD ID" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search satellites" />
        </div>
      </div>

      {cats.length > 1 && (
        <div className="oa-cats">
          {cats.map(k => (
            <button key={k} className={'oa-chip' + (hidden.has(k) ? ' off' : '')} onClick={() => onToggleCat?.(k)} aria-pressed={!hidden.has(k)} title={hidden.has(k) ? 'Show' : 'Hide'}>
              <i style={{ background: CAT[k].color }} />{CAT[k].label}<span>{counts[k].toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}

      <div className="oa-list">
        {ordered.length === 0 && <div className="oa-more oa-mono oa-dim">No objects match</div>}
        {ordered.slice(0, LIMIT).map(sat => {
          const isRisk = riskIds.has(sat.id), isSel = selected?.id === sat.id
          const alt = sat.position?.alt
          return (
            <div key={sat.id} className={'oa-row' + (isSel ? ' sel' : isRisk ? ' risk' : '')} onClick={() => onSelect(isSel ? null : sat)}>
              <i style={{ background: isRisk ? '#ff5a1f' : catOf(sat.cat).color }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="nm">{sat.name}</div>
                <div className="sub oa-mono oa-dim">{sat.id} · {alt != null ? Math.round(alt).toLocaleString() + ' km' : '—'}</div>
              </div>
              {isRisk && <span className="oa-tag oa-mono">Risk</span>}
            </div>
          )
        })}
        {ordered.length > LIMIT && <div className="oa-more oa-mono oa-dim">Showing {LIMIT} of {ordered.length.toLocaleString()} · search to narrow</div>}
      </div>

      {risks.length > 0 && (
        <div className="oa-conj">
          <div className="oa-conj-hd oa-mono"><span>Conjunctions</span><span>{risks.length}</span></div>
          {risks.slice(0, 50).map((r, i) => (
            <div key={i} className="oa-conj-row" style={{ cursor: byId.has(r.id1) ? 'pointer' : 'default' }} onClick={() => byId.has(r.id1) && onSelect(byId.get(r.id1))}>
              <div className="nm">{r.sat1} <span style={{ color: '#5d6168' }}>×</span> {r.sat2}</div>
              <div className="sub oa-mono" style={{ color: r.severity === 'CRITICAL' ? '#ff5a1f' : '#9a9ea5' }}>{r.distanceKm} km · {fmtTca(r.tca)}</div>
            </div>
          ))}
        </div>
      )}

      {!isPro && <SidebarAd />}
      {!isPro && <UpgradePrompt onUpgrade={() => { window.location.href = '/pricing' }} />}
    </aside>
  )
}

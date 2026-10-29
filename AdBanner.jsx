import { C, MONO } from './theme.js'

const mono = { fontFamily: MONO, fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase' }

function AdSlot({ style, label = 'Advertisement' }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }}>
      <div style={{ width: '100%', height: '100%', background: C.bg2, border: `1px dashed ${C.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
        <span style={{ ...mono, color: C.dim }}>{label}</span>
      </div>
    </div>
  )
}

export function SidebarAd() {
  return (
    <div style={{ borderTop: `1px solid ${C.line}`, padding: '10px 16px', flexShrink: 0 }}>
      <div style={{ ...mono, color: C.dim, marginBottom: 6 }}>Sponsored</div>
      <AdSlot style={{ height: 72 }} label="Ad slot" />
    </div>
  )
}

export function UpgradePrompt({ onUpgrade }) {
  return (
    <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${C.line}`, flexShrink: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 4 }}>Alerts, API, no ads</div>
      <div style={{ fontSize: 12.5, color: C.mut, marginBottom: 12, lineHeight: 1.5 }}>Pro adds conjunction alerts, webhooks and 10,000 API requests an hour.</div>
      <button onClick={onUpgrade} className="oa-btn sec" style={{ width: '100%', justifyContent: 'center' }}>Upgrade to Pro →</button>
    </div>
  )
}

export function LoadingSponsor() {
  return (
    <div style={{ marginTop: 18, padding: '10px 18px', border: `1px solid ${C.line}`, textAlign: 'center' }}>
      <div style={{ ...mono, color: C.dim }}>Sponsored by</div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim, marginTop: 6 }}>Your company here · hello@orbitos.space</div>
    </div>
  )
}

export function StatusBarAd() {
  return (
    <span style={{ ...mono, color: C.dim, borderLeft: `1px solid ${C.line}`, paddingLeft: 14, whiteSpace: 'nowrap' }}>
      Sponsored · <a href="mailto:hello@orbitos.space" style={{ color: C.mut }}>Advertise</a>
    </span>
  )
}

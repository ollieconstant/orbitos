// src/components/AdBanner.jsx
// Ad placements for free tier users
// Swap the placeholder divs for real Google AdSense tags when approved

const M = 'system-ui,-apple-system,sans-serif'

// Placeholder ad component — replace inner div with AdSense code
function AdSlot({ style, label = 'Advertisement' }) {
  return (
    <div style={{ position:'relative', overflow:'hidden', ...style }}>
      {/* ── REPLACE THIS DIV WITH YOUR ADSENSE CODE ───────────
          <ins class="adsbygoogle"
               style="display:block"
               data-ad-client="ca-pub-XXXXXXXXXX"
               data-ad-slot="XXXXXXXXXX"
               data-ad-format="auto"
               data-full-width-responsive="true">
          </ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      ─────────────────────────────────────────────────────── */}

      {/* Placeholder shown until AdSense is set up */}
      <div style={{
        width:'100%', height:'100%',
        background:'rgba(255,255,255,0.03)',
        border:'1px dashed rgba(255,255,255,0.08)',
        display:'flex', alignItems:'center', justifyContent:'center',
        flexDirection:'column', gap:4,
      }}>
        <span style={{ fontSize:9, color:'rgba(148,163,184,0.25)', fontFamily:M, letterSpacing:1, textTransform:'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize:8, color:'rgba(148,163,184,0.15)', fontFamily:M }}>
          AdSense slot
        </span>
      </div>
    </div>
  )
}

// ── SIDEBAR AD ────────────────────────────────────────────────
// Shows at the bottom of the sidebar on free tier
export function SidebarAd() {
  return (
    <div style={{
      borderTop:'1px solid rgba(255,255,255,0.07)',
      padding:'8px',
      background:'rgba(255,255,255,0.02)',
      flexShrink:0,
    }}>
      <div style={{ fontSize:9, color:'rgba(148,163,184,0.2)', fontFamily:M, marginBottom:4, textAlign:'center', letterSpacing:.5 }}>
        SPONSORED
      </div>
      <AdSlot style={{ height:90, borderRadius:4 }} label="Sidebar ad (90px)" />
    </div>
  )
}

// ── DASHBOARD AD PANEL ────────────────────────────────────────
// Replaces one dashboard panel on free tier
export function DashboardAdPanel() {
  return (
    <div style={{
      background:'#0f172a',
      border:'1px solid rgba(255,255,255,0.07)',
      borderRadius:8, padding:14,
      display:'flex', flexDirection:'column',
    }}>
      <div style={{ fontSize:9, color:'rgba(148,163,184,0.2)', fontFamily:M, marginBottom:8, letterSpacing:1, textTransform:'uppercase' }}>
        Sponsored
      </div>
      <AdSlot style={{ flex:1, borderRadius:6, minHeight:100 }} label="Dashboard ad" />
    </div>
  )
}

// ── LOADING SCREEN SPONSOR ────────────────────────────────────
// Subtle "Powered by" on loading screen
export function LoadingSponsor() {
  return (
    <div style={{
      marginTop:24, padding:'8px 16px',
      border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:6, textAlign:'center',
    }}>
      <span style={{ fontSize:10, color:'rgba(148,163,184,0.2)', fontFamily:M, letterSpacing:.5 }}>
        SPONSORED BY
      </span>
      <div style={{ height:24, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:11, color:'rgba(148,163,184,0.15)', fontFamily:M }}>
          Your aerospace company here — hello@orbitos.space
        </span>
      </div>
    </div>
  )
}

// ── STATUS BAR AD ─────────────────────────────────────────────
// Tiny text ad in the status bar
export function StatusBarAd() {
  return (
    <span style={{
      fontSize:10, color:'rgba(148,163,184,0.25)', fontFamily:M,
      borderLeft:'1px solid rgba(255,255,255,0.07)', paddingLeft:12,
    }}>
      Sponsored · <a href="mailto:hello@orbitos.space" style={{ color:'rgba(56,189,248,0.35)', textDecoration:'none' }}>
        Advertise on OrbitOS
      </a>
    </span>
  )
}

// ── UPGRADE PROMPT ────────────────────────────────────────────
// Shown below the sidebar ad — drives Pro conversions
export function UpgradePrompt({ onUpgrade }) {
  return (
    <div style={{
      padding:'10px 12px',
      background:'rgba(56,189,248,0.05)',
      borderTop:'1px solid rgba(56,189,248,0.1)',
      flexShrink:0,
    }}>
      <div style={{ fontSize:12, fontWeight:600, color:'#38bdf8', fontFamily:M, marginBottom:3 }}>
        Remove ads
      </div>
      <div style={{ fontSize:11, color:'rgba(148,163,184,0.5)', fontFamily:M, marginBottom:8, lineHeight:1.5 }}>
        Upgrade to Pro for an ad-free experience and full satellite access.
      </div>
      <button
        onClick={onUpgrade}
        style={{ width:'100%', padding:'7px', background:'rgba(56,189,248,0.12)', border:'1px solid rgba(56,189,248,0.3)', borderRadius:6, color:'#38bdf8', fontFamily:M, fontSize:12, fontWeight:600, cursor:'pointer' }}
      >
        Upgrade to Pro — £299/mo
      </button>
    </div>
  )
}

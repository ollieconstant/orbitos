import { useState, useEffect } from 'react'

const M = 'system-ui,-apple-system,sans-serif'
const COOKIE_KEY = 'orbitos_cookie_consent'

export function useCookieConsent() {
  const [consent, setConsent] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY)
      if (stored) setConsent(JSON.parse(stored))
    } catch {}
  }, [])

  const accept = (opts = { analytics:true, advertising:true }) => {
    const val = { ...opts, essential:true, timestamp:Date.now() }
    try { localStorage.setItem(COOKIE_KEY, JSON.stringify(val)) } catch {}
    setConsent(val)

    // Only load AdSense if advertising accepted
    if (opts.advertising && !document.getElementById('adsense-script')) {
      const s = document.createElement('script')
      s.id  = 'adsense-script'
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX'
      s.async = true
      s.crossOrigin = 'anonymous'
      document.head.appendChild(s)
    }
  }

  const decline = () => {
    const val = { essential:true, analytics:false, advertising:false, timestamp:Date.now() }
    try { localStorage.setItem(COOKIE_KEY, JSON.stringify(val)) } catch {}
    setConsent(val)
  }

  const reset = () => {
    try { localStorage.removeItem(COOKIE_KEY) } catch {}
    setConsent(null)
  }

  return { consent, accept, decline, reset, hasChosen: consent !== null }
}

export default function CookieBanner({ onAccept, onDecline }) {
  const [showDetails, setShowDetails] = useState(false)
  const [opts, setOpts] = useState({ analytics:true, advertising:true })

  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:1000, padding:16, background:'rgba(10,16,32,0.98)', borderTop:'1px solid rgba(56,189,248,0.2)', backdropFilter:'blur(12px)', fontFamily:M }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        {/* Main bar */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:20, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:280 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:16, color:'#38bdf8' }}>◎</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#f1f5f9' }}>Cookie preferences</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(148,163,184,0.6)', lineHeight:1.6, margin:0 }}>
              We use essential cookies to keep OrbitOS working. With your permission we also use analytics cookies (to improve the product) and advertising cookies (to show relevant ads on the free tier).
              {' '}<a href="/privacy" style={{ color:'rgba(56,189,248,0.7)', textDecoration:'none' }}>Privacy Policy</a>
            </p>
          </div>

          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0, flexWrap:'wrap' }}>
            <button onClick={() => setShowDetails(!showDetails)} style={{ padding:'7px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, color:'rgba(148,163,184,0.6)', fontFamily:M, fontSize:12, cursor:'pointer' }}>
              {showDetails ? 'Hide' : 'Customise'}
            </button>
            <button onClick={onDecline} style={{ padding:'7px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, color:'rgba(148,163,184,0.6)', fontFamily:M, fontSize:12, cursor:'pointer' }}>
              Essential only
            </button>
            <button onClick={() => onAccept(opts)} style={{ padding:'7px 16px', background:'#38bdf8', border:'none', borderRadius:7, color:'#0f172a', fontFamily:M, fontSize:12, fontWeight:700, cursor:'pointer' }}>
              Accept all
            </button>
          </div>
        </div>

        {/* Details panel */}
        {showDetails && (
          <div style={{ marginTop:16, padding:16, background:'rgba(255,255,255,0.04)', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
              {[
                { key:'essential',    label:'Essential',    desc:'Login, security, site functionality. Cannot be disabled.',          locked:true  },
                { key:'analytics',    label:'Analytics',    desc:'Anonymous usage stats to help us improve OrbitOS.',                  locked:false },
                { key:'advertising',  label:'Advertising',  desc:'Show relevant ads on the free tier. Upgrade to Pro to remove ads.',  locked:false },
              ].map(c => (
                <div key={c.key} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ flexShrink:0, marginTop:2 }}>
                    {c.locked ? (
                      <div style={{ width:32, height:18, background:'rgba(56,189,248,0.3)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'0 2px' }}>
                        <div style={{ width:14, height:14, borderRadius:'50%', background:'#38bdf8' }} />
                      </div>
                    ) : (
                      <div onClick={() => setOpts(p => ({...p,[c.key]:!p[c.key]}))}
                        style={{ width:32, height:18, background:opts[c.key]?'rgba(56,189,248,0.3)':'rgba(255,255,255,0.08)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:opts[c.key]?'flex-end':'flex-start', padding:'0 2px', cursor:'pointer', transition:'all .2s' }}>
                        <div style={{ width:14, height:14, borderRadius:'50%', background:opts[c.key]?'#38bdf8':'rgba(148,163,184,0.4)' }} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#f1f5f9', marginBottom:2 }}>{c.label}{c.locked&&' (required)'}</div>
                    <div style={{ fontSize:11, color:'rgba(148,163,184,0.5)', lineHeight:1.5 }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => onAccept(opts)} style={{ marginTop:14, padding:'8px 20px', background:'#38bdf8', border:'none', borderRadius:7, color:'#0f172a', fontFamily:M, fontSize:12, fontWeight:700, cursor:'pointer' }}>
              Save preferences
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

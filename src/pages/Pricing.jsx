import { useState } from 'react'

const M = 'system-ui,-apple-system,sans-serif'

const PLANS = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'For researchers and students exploring orbital data.',
    color: '#64748b',
    features: [
      { text: '100 API requests / hour',         included: true  },
      { text: 'Live satellite tracking',           included: true  },
      { text: '9 built-in satellites',            included: true  },
      { text: '3D & 2D globe viewer',             included: true  },
      { text: 'Basic conjunction alerts',          included: true  },
      { text: 'Community support',                included: true  },
      { text: 'Full 27,000+ catalogue',           included: false },
      { text: 'Email & push alerts',              included: false },
      { text: 'Webhook notifications',            included: false },
      { text: 'Orbit path prediction',            included: false },
      { text: 'API key & dashboard',              included: false },
      { text: 'SLA guarantee',                    included: false },
    ],
    cta: 'Start for free',
    ctaStyle: 'outline',
  },
  {
    name: 'Pro',
    price: { monthly: 299, annual: 249 },
    description: 'For satellite operators who need reliable conjunction data.',
    color: '#38bdf8',
    popular: true,
    features: [
      { text: '10,000 API requests / hour',       included: true  },
      { text: 'Live satellite tracking',           included: true  },
      { text: 'Full 27,000+ satellite catalogue',  included: true  },
      { text: '3D & 2D globe viewer',             included: true  },
      { text: 'Real-time conjunction alerts',      included: true  },
      { text: 'Email & push notifications',        included: true  },
      { text: 'Webhook delivery',                 included: true  },
      { text: '7-day orbit prediction',           included: true  },
      { text: 'API key & usage dashboard',        included: true  },
      { text: 'Priority support (24hr)',          included: true  },
      { text: 'Custom alert thresholds',          included: true  },
      { text: 'SLA guarantee',                    included: false },
    ],
    cta: 'Start Pro trial',
    ctaStyle: 'primary',
  },
  {
    name: 'Enterprise',
    price: { monthly: null, annual: null },
    description: 'For agencies, launch providers, and governments.',
    color: '#a78bfa',
    features: [
      { text: 'Unlimited API requests',           included: true  },
      { text: 'Live satellite tracking',           included: true  },
      { text: 'Full 27,000+ satellite catalogue',  included: true  },
      { text: '3D & 2D globe viewer',             included: true  },
      { text: 'Real-time conjunction alerts',      included: true  },
      { text: 'Email, push & webhook alerts',     included: true  },
      { text: '30-day orbit prediction',          included: true  },
      { text: 'Dedicated API infrastructure',     included: true  },
      { text: 'White-label licensing',            included: true  },
      { text: 'Custom integrations',              included: true  },
      { text: '99.9% uptime SLA',                included: true  },
      { text: 'Dedicated account manager',        included: true  },
    ],
    cta: 'Contact us',
    ctaStyle: 'outline-purple',
  },
]

const FAQS = [
  { q: 'Can I cancel at any time?', a: 'Yes. Pro plans can be cancelled any time from your dashboard. You keep access until the end of your billing period.' },
  { q: 'How accurate is the conjunction data?', a: 'Our SGP4 propagation engine uses the same algorithm as US Space Force tracking. Position accuracy is typically within 1–10 km for LEO objects with TLE data updated every 6 hours.' },
  { q: 'What is a TLE?', a: 'A Two-Line Element set is a standardised format for describing a satellite\'s orbit. We fetch TLE data from Celestrak, maintained by the US Space Force, and update it every 6 hours.' },
  { q: 'Do you offer student or academic discounts?', a: 'Yes — universities and research institutions get 50% off Pro. Email us with your institutional address.' },
  { q: 'Can I integrate OrbitOS into my ground station software?', a: 'Absolutely. Pro and Enterprise plans include full REST API access with webhook support for real-time conjunction alerts.' },
  { q: 'What countries do you support?', a: 'OrbitOS is available worldwide. Enterprise licensing is available for government agencies and national space programmes in any country.' },
]

export default function Pricing() {
  const [annual,  setAnnual]  = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div style={{ background:'#0a1020', minHeight:'100vh', fontFamily:M, color:'#cbd5e1' }}>

      {/* Nav */}
      <nav style={{ height:52, background:'#0f172a', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', padding:'0 24px', gap:8 }}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', marginRight:12 }}>
          <span style={{ fontSize:20, color:'#38bdf8' }}>◎</span>
          <span style={{ color:'#38bdf8', fontWeight:700, fontSize:15 }}>OrbitOS</span>
        </a>
        {[['/', 'Product'], ['/pricing', 'Pricing'], ['/#api', 'API']].map(([href, label]) => (
          <a key={href} href={href} style={{ padding:'6px 12px', fontSize:13, color: href==='/pricing' ? '#38bdf8' : 'rgba(148,163,184,0.55)', textDecoration:'none', borderRadius:6, background: href==='/pricing' ? 'rgba(56,189,248,0.1)' : 'transparent' }}>{label}</a>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <a href="/login"  style={{ padding:'7px 16px', fontSize:13, color:'rgba(148,163,184,0.7)', textDecoration:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7 }}>Sign in</a>
          <a href="/signup" style={{ padding:'7px 16px', fontSize:13, color:'#0f172a', background:'#38bdf8', textDecoration:'none', borderRadius:7, fontWeight:600 }}>Get started</a>
        </div>
      </nav>

      <div style={{ maxWidth:1080, margin:'0 auto', padding:'64px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ display:'inline-block', fontSize:12, fontWeight:600, color:'#38bdf8', background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:20, padding:'4px 14px', letterSpacing:.5, marginBottom:20 }}>
            Simple, transparent pricing
          </div>
          <h1 style={{ fontSize:42, fontWeight:700, color:'#f1f5f9', margin:'0 0 16px', lineHeight:1.15, letterSpacing:-1 }}>
            The airspace for orbit
          </h1>
          <p style={{ fontSize:17, color:'rgba(148,163,184,0.65)', maxWidth:500, margin:'0 auto 32px', lineHeight:1.7 }}>
            Real-time satellite tracking and collision detection — from university CubeSats to national space agencies.
          </p>
          {/* Billing toggle */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:0, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:30, padding:4 }}>
            {[{label:'Monthly', val:false}, {label:'Annual', val:true}].map(opt => (
              <button key={opt.label} onClick={() => setAnnual(opt.val)}
                style={{ padding:'6px 20px', borderRadius:24, border:'none', background: annual===opt.val ? '#38bdf8' : 'transparent', color: annual===opt.val ? '#0f172a' : 'rgba(148,163,184,0.6)', fontSize:13, fontWeight: annual===opt.val ? 600 : 400, cursor:'pointer', fontFamily:M, transition:'all .2s', display:'flex', alignItems:'center', gap:7 }}>
                {opt.label}
                {opt.val && <span style={{ fontSize:11, fontWeight:600, color: annual ? '#0f172a' : '#34d399', background: annual ? 'rgba(15,23,42,0.2)' : 'rgba(52,211,153,0.15)', borderRadius:8, padding:'1px 6px' }}>Save 17%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:72, alignItems:'start' }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{ background:'#0f172a', border:`${plan.popular?'2px':'1px'} solid ${plan.popular?'#38bdf8':'rgba(255,255,255,0.08)'}`, borderRadius:14, overflow:'hidden' }}>
              {plan.popular && <div style={{ background:'#38bdf8', color:'#0f172a', fontSize:11, fontWeight:700, textAlign:'center', padding:'5px 0', letterSpacing:.5 }}>MOST POPULAR</div>}
              <div style={{ padding:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:plan.color }} />
                  <span style={{ fontSize:12, fontWeight:600, color:plan.color, letterSpacing:.5 }}>{plan.name.toUpperCase()}</span>
                </div>
                <div style={{ marginBottom:10 }}>
                  {plan.price.monthly === null
                    ? <div style={{ fontSize:30, fontWeight:700, color:'#f1f5f9' }}>Custom</div>
                    : plan.price.monthly === 0
                    ? <div style={{ fontSize:30, fontWeight:700, color:'#f1f5f9' }}>Free</div>
                    : <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                        <span style={{ fontSize:14, color:'rgba(148,163,184,0.4)' }}>£</span>
                        <span style={{ fontSize:38, fontWeight:700, color:'#f1f5f9', lineHeight:1 }}>{annual ? plan.price.annual : plan.price.monthly}</span>
                        <span style={{ fontSize:13, color:'rgba(148,163,184,0.4)' }}>/mo</span>
                      </div>
                  }
                  {annual && plan.price.monthly > 0 && <div style={{ fontSize:12, color:'#34d399', marginTop:3 }}>Billed £{(plan.price.annual ?? 0) * 12}/year</div>}
                </div>
                <p style={{ fontSize:13, color:'rgba(148,163,184,0.5)', lineHeight:1.6, margin:'0 0 18px', minHeight:38 }}>{plan.description}</p>
                <a href={plan.cta === 'Contact us' ? 'mailto:hello@orbitos.space' : '/signup'}
                  style={{ display:'block', textAlign:'center', padding:'10px', borderRadius:8, fontSize:13, fontWeight:600, textDecoration:'none', marginBottom:22, transition:'all .15s',
                    ...(plan.ctaStyle==='primary' ? { background:'#38bdf8', color:'#0f172a', border:'none' }
                      : plan.ctaStyle==='outline-purple' ? { background:'transparent', color:'#a78bfa', border:'1px solid rgba(167,139,250,0.35)' }
                      : { background:'transparent', color:'rgba(148,163,184,0.75)', border:'1px solid rgba(255,255,255,0.12)' }) }}>
                  {plan.cta}
                </a>
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:18 }}>
                  {plan.features.map((f,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}>
                      <div style={{ width:15, height:15, borderRadius:'50%', flexShrink:0, background: f.included ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:9, color: f.included ? '#34d399' : 'rgba(148,163,184,0.25)' }}>{f.included ? '✓' : '×'}</span>
                      </div>
                      <span style={{ fontSize:12, color: f.included ? '#94a3b8' : 'rgba(148,163,184,0.28)', lineHeight:1.4 }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden', marginBottom:72 }}>
          {[{v:'27,000+',l:'Objects tracked'},{v:'5s',l:'Update frequency'},{v:'< 5km',l:'Alert threshold'},{v:'99.9%',l:'Uptime target'}].map(({v,l}) => (
            <div key={l} style={{ padding:'26px 16px', textAlign:'center', background:'#0f172a' }}>
              <div style={{ fontSize:26, fontWeight:700, color:'#38bdf8', marginBottom:5 }}>{v}</div>
              <div style={{ fontSize:12, color:'rgba(148,163,184,0.45)' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth:660, margin:'0 auto 72px' }}>
          <h2 style={{ fontSize:26, fontWeight:700, color:'#f1f5f9', textAlign:'center', marginBottom:6 }}>Common questions</h2>
          <p style={{ fontSize:14, color:'rgba(148,163,184,0.4)', textAlign:'center', marginBottom:32 }}>Anything else? Email hello@orbitos.space</p>
          {FAQS.map((faq,i) => (
            <div key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
                style={{ width:'100%', padding:'17px 0', display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:'none', cursor:'pointer', fontFamily:M, textAlign:'left' }}>
                <span style={{ fontSize:14, color:'#e2e8f0', fontWeight:500 }}>{faq.q}</span>
                <span style={{ fontSize:20, color:'rgba(148,163,184,0.35)', flexShrink:0, marginLeft:16, display:'inline-block', transform: openFaq===i ? 'rotate(45deg)' : 'none', transition:'transform .2s' }}>+</span>
              </button>
              {openFaq===i && <p style={{ fontSize:13, color:'rgba(148,163,184,0.55)', lineHeight:1.8, margin:'0 0 16px', paddingRight:20 }}>{faq.a}</p>}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ background:'#0f172a', border:'1px solid rgba(56,189,248,0.18)', borderRadius:16, padding:'44px 36px', textAlign:'center' }}>
          <h2 style={{ fontSize:28, fontWeight:700, color:'#f1f5f9', margin:'0 0 10px' }}>Ready to track the orbital layer?</h2>
          <p style={{ fontSize:15, color:'rgba(148,163,184,0.55)', margin:'0 0 26px', lineHeight:1.7 }}>Join satellite operators, researchers, and engineers already using OrbitOS. Start free, upgrade when you need more.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <a href="/signup" style={{ padding:'11px 26px', background:'#38bdf8', color:'#0f172a', borderRadius:8, fontSize:14, fontWeight:700, textDecoration:'none' }}>Start for free</a>
            <a href="mailto:hello@orbitos.space" style={{ padding:'11px 26px', background:'transparent', color:'rgba(148,163,184,0.6)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:14, textDecoration:'none' }}>Talk to us</a>
          </div>
          <p style={{ fontSize:12, color:'rgba(148,163,184,0.25)', marginTop:14 }}>No credit card required · Cancel anytime · Free plan forever</p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'28px 24px', maxWidth:1080, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16, color:'#38bdf8' }}>◎</span>
            <span style={{ color:'#38bdf8', fontWeight:700, fontSize:13 }}>OrbitOS</span>
            <span style={{ color:'rgba(148,163,184,0.25)', fontSize:12 }}>· The airspace for orbit</span>
          </div>
          <div style={{ display:'flex', gap:18 }}>
            {['Privacy','Terms','API docs','Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize:12, color:'rgba(148,163,184,0.3)', textDecoration:'none' }}>{l}</a>
            ))}
          </div>
          <span style={{ fontSize:12, color:'rgba(148,163,184,0.2)' }}>© 2025 OrbitOS</span>
        </div>
      </footer>
    </div>
  )
}

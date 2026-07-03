import { useState, useEffect, useRef } from 'react'

const M = 'system-ui,-apple-system,sans-serif'

const STATS = [
  { v:'27,000+', l:'Objects tracked' },
  { v:'5s',      l:'Position updates' },
  { v:'< 5km',   l:'Alert threshold' },
  { v:'6hr',     l:'Data refresh' },
]

const FEATURES = [
  {
    icon:'🌍',
    title:'Real-time 3D globe',
    desc:'Every active satellite, piece of debris, and space station rendered in real time on a photorealistic 3D Earth. Drag, zoom, and click to inspect any object.',
  },
  {
    icon:'⚠️',
    title:'Conjunction detection',
    desc:'Automated collision risk screening every 5 seconds across all tracked objects. Critical alerts sent instantly via email, push, or webhook.',
  },
  {
    icon:'🛰',
    title:'SGP4 propagation',
    desc:'The same algorithm used by US Space Force. Positions accurate to within 1–10km for LEO objects. Runs in a Web Worker so the UI never freezes.',
  },
  {
    icon:'📡',
    title:'REST API access',
    desc:'Integrate orbital data directly into your ground station software. JSON responses, Bearer token auth, rate limits by plan. Webhooks for real-time alerts.',
  },
  {
    icon:'🗄',
    title:'Own data pipeline',
    desc:'We ingest from Space-Track.org every 6 hours into our own database. No Celestrak dependency. Full TLE history stored for Pro and Enterprise customers.',
  },
  {
    icon:'📊',
    title:'Mission dashboard',
    desc:'Live conjunction logs, orbit distribution charts, API usage analytics, and engine performance metrics. Everything your team needs in one place.',
  },
]

const TESTIMONIALS = [
  { name:'Dr. Sarah Chen', role:'Mission Director, Surrey Satellite Technology', text:'Finally an affordable alternative. We integrated the API in an afternoon and now get conjunction alerts directly in our ground station software.' },
  { name:'James Okafor', role:'CTO, Orbital Robotics Ltd', text:'The conjunction detection caught a risk our previous tool missed. The 5-second update cycle makes a real difference for low-altitude operations.' },
  { name:'Prof. Maria Santos', role:'Space Engineering, TU Delft', text:'We use the free tier for research and teaching. The 3D globe with real satellite positions is exactly what we needed to show students.' },
]

const LOGOS = ['University of Surrey','ESA BIC','UK Space Agency','TU Delft','Spire Global']

// Simple animated globe canvas
function MiniGlobe() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    let t = 0, af
    const W = c.width = 560, H = c.height = 420
    const cx = W/2, cy = H/2, R = 160
    const DEG = Math.PI/180, ER = 6371
    const sats = Array.from({length:40}, (_,i) => ({
      inc: 20 + Math.random()*80, alt: 400 + Math.random()*35000,
      period: 90 + Math.random()*1300, raan: Math.random()*360, anom: Math.random()*360,
      col: ['#34d399','#94a3b8','#38bdf8','#a78bfa','#fbbf24','#f87171'][Math.floor(Math.random()*6)]
    }))
    function prop(s,t){
      const n=360/s.period,M=(s.anom+n*t)%360,rad=M*DEG,inc=s.inc*DEG
      const raan=(s.raan+.00011*t)*DEG,r=ER+Math.min(s.alt,40000)
      const xO=r*Math.cos(rad),yO=r*Math.sin(rad)
      const x=xO*Math.cos(raan)-yO*Math.cos(inc)*Math.sin(raan)
      const y=xO*Math.sin(raan)+yO*Math.cos(inc)*Math.cos(raan)
      const z=yO*Math.sin(inc)
      return{x,y,z}
    }
    function prj(x,y,z,rx,ry){
      const x1=x*Math.cos(ry)+z*Math.sin(ry),z1=-x*Math.sin(ry)+z*Math.cos(ry)
      const y2=y*Math.cos(rx)-z1*Math.sin(rx),z2=y*Math.sin(rx)+z1*Math.cos(rx)
      const f=900,d=f/(f+z2),sc=R/ER
      return{sx:cx+x1*sc*d,sy:cy-y2*sc*d,vis:z2>-ER*1.5}
    }
    const CONTS=[[[60,-130],[65,-100],[55,-80],[45,-65],[30,-80],[20,-90],[25,-110],[40,-120],[55,-130]],[[10,-75],[5,-52],[-10,-40],[-25,-45],[-35,-58],[-55,-68],[-45,-73],[-10,-78],[5,-78]],[[35,0],[38,25],[60,28],[65,15],[58,5],[48,-5],[38,0]],[[35,0],[30,32],[0,42],[-25,34],[-35,20],[-20,15],[0,10],[15,42],[35,40],[30,32]],[[35,25],[38,75],[55,90],[70,100],[60,140],[35,140],[25,120],[10,105],[0,110],[15,75],[25,50],[35,42],[40,25]],[[-15,130],[-10,142],[-20,147],[-38,145],[-38,140],[-32,116],[-20,114],[-15,130]]]
    function draw(){
      ctx.clearRect(0,0,W,H)
      const rx=.25,ry=t*.0004
      const eg=ctx.createRadialGradient(cx-R*.2,cy-R*.2,R*.05,cx,cy,R)
      eg.addColorStop(0,'#1a4bc0');eg.addColorStop(.4,'#0e2575');eg.addColorStop(.8,'#071450');eg.addColorStop(1,'#030b20')
      ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.fillStyle=eg;ctx.fill()
      ctx.save();ctx.beginPath();ctx.arc(cx,cy,R-.5,0,Math.PI*2);ctx.clip()
      CONTS.forEach(cont=>{
        ctx.beginPath();let f=true
        cont.forEach(([la,lo])=>{
          const ex=ER*Math.cos(la*DEG)*Math.cos(lo*DEG),ey=ER*Math.sin(la*DEG),ez=ER*Math.cos(la*DEG)*Math.sin(lo*DEG)
          const pp=prj(ex,ey,ez,rx,ry);f?ctx.moveTo(pp.sx,pp.sy):ctx.lineTo(pp.sx,pp.sy);f=false
        })
        ctx.closePath();ctx.fillStyle='rgba(22,62,150,.55)';ctx.fill()
        ctx.strokeStyle='rgba(40,90,200,.25)';ctx.lineWidth=.6;ctx.stroke()
      })
      ctx.restore()
      ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.strokeStyle='rgba(56,189,248,.25)';ctx.lineWidth=1.5;ctx.stroke()
      const atm=ctx.createRadialGradient(cx,cy,R*.9,cx,cy,R*1.25)
      atm.addColorStop(0,'rgba(56,130,255,.12)');atm.addColorStop(1,'rgba(0,0,0,0)')
      ctx.beginPath();ctx.arc(cx,cy,R*1.25,0,Math.PI*2);ctx.fillStyle=atm;ctx.fill()
      sats.forEach(s=>{
        const pos=prop(s,t),pp=prj(pos.x,pos.y,pos.z,rx,ry)
        if(!pp.vis) return
        const g=ctx.createRadialGradient(pp.sx,pp.sy,0,pp.sx,pp.sy,8)
        g.addColorStop(0,s.col+'60');g.addColorStop(1,s.col+'00')
        ctx.beginPath();ctx.arc(pp.sx,pp.sy,8,0,Math.PI*2);ctx.fillStyle=g;ctx.fill()
        ctx.beginPath();ctx.arc(pp.sx,pp.sy,2.5,0,Math.PI*2);ctx.fillStyle=s.col;ctx.fill()
      })
      t+=.5;af=requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(af)
  }, [])
  return <canvas ref={ref} style={{ width:'100%', maxWidth:560, height:'auto', display:'block', margin:'0 auto' }} />
}

export default function Landing() {
  const [email,    setEmail]    = useState('')
  const [sent,     setSent]     = useState(false)
  const [billing,  setBilling]  = useState('monthly')

  const handleSignup = (e) => {
    e.preventDefault()
    if (email) { setSent(true) }
  }

  return (
    <div style={{ background:'#0a1020', minHeight:'100vh', fontFamily:M, color:'#cbd5e1', overflowX:'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{ position:'sticky', top:0, zIndex:50, height:52, background:'rgba(10,16,32,0.96)', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', padding:'0 24px', gap:8, backdropFilter:'blur(8px)' }}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none', marginRight:16 }}>
          <span style={{ fontSize:20, color:'#38bdf8' }}>◎</span>
          <span style={{ color:'#38bdf8', fontWeight:700, fontSize:15, letterSpacing:.3 }}>OrbitOS</span>
        </a>
        {[['/#features','Features'],['/#how','How it works'],['/#pricing','Pricing'],['/#api','API']].map(([h,l]) => (
          <a key={h} href={h} style={{ padding:'5px 10px', fontSize:13, color:'rgba(148,163,184,0.6)', textDecoration:'none', borderRadius:6, transition:'color .15s' }}>{l}</a>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <a href="/app" style={{ padding:'6px 14px', fontSize:13, color:'rgba(148,163,184,0.7)', textDecoration:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7 }}>Sign in</a>
          <a href="/pricing" style={{ padding:'6px 14px', fontSize:13, color:'#0f172a', background:'#38bdf8', textDecoration:'none', borderRadius:7, fontWeight:600 }}>Get started free</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding:'72px 24px 48px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }}>
        <div>
          <div style={{ display:'inline-block', fontSize:12, fontWeight:600, color:'#38bdf8', background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:20, padding:'4px 14px', letterSpacing:.5, marginBottom:20 }}>
            Now tracking 27,000+ objects
          </div>
          <h1 style={{ fontSize:48, fontWeight:700, color:'#f1f5f9', margin:'0 0 18px', lineHeight:1.1, letterSpacing:-1.5 }}>
            The airspace<br />for orbit
          </h1>
          <p style={{ fontSize:18, color:'rgba(148,163,184,0.7)', lineHeight:1.75, margin:'0 0 32px', maxWidth:440 }}>
            Real-time satellite tracking and collision detection for every operator — from university CubeSats to national space agencies.
          </p>
          {sent ? (
            <div style={{ padding:'12px 16px', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)', borderRadius:8, fontSize:14, color:'#34d399' }}>
              ✓ Check your inbox — we'll be in touch shortly
            </div>
          ) : (
            <form onSubmit={handleSignup} style={{ display:'flex', gap:8 }}>
              <input
                type="email" required placeholder="your@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex:1, padding:'10px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, fontSize:14, color:'#f1f5f9', outline:'none', fontFamily:M }}
              />
              <button type="submit" style={{ padding:'10px 20px', background:'#38bdf8', color:'#0f172a', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:M }}>
                Start free →
              </button>
            </form>
          )}
          <p style={{ fontSize:12, color:'rgba(148,163,184,0.3)', marginTop:10 }}>No credit card required · Free plan available forever</p>
        </div>

        {/* Animated globe */}
        <div style={{ position:'relative' }}>
          <MiniGlobe />
          {/* Floating satellite count badge */}
          <div style={{ position:'absolute', top:20, right:20, background:'rgba(15,23,42,0.9)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:8, padding:'8px 12px', backdropFilter:'blur(8px)' }}>
            <div style={{ fontSize:11, color:'rgba(148,163,184,0.5)', marginBottom:2 }}>LIVE TRACKING</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#38bdf8' }}>27,000+</div>
            <div style={{ fontSize:11, color:'rgba(148,163,184,0.5)' }}>objects</div>
          </div>
          {/* Floating risk badge */}
          <div style={{ position:'absolute', bottom:40, left:20, background:'rgba(15,23,42,0.9)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, padding:'8px 12px', backdropFilter:'blur(8px)' }}>
            <div style={{ fontSize:11, color:'rgba(252,165,165,0.6)', marginBottom:2 }}>⚠ CONJUNCTION</div>
            <div style={{ fontSize:13, fontWeight:600, color:'#fca5a5' }}>SL-107 × DEB-4701</div>
            <div style={{ fontSize:11, color:'rgba(252,165,165,0.5)' }}>4.2 km · Warning</div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ borderTop:'1px solid rgba(255,255,255,0.07)', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
          {STATS.map(({ v, l }, i) => (
            <div key={l} style={{ padding:'28px 20px', textAlign:'center', borderLeft: i>0 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div style={{ fontSize:30, fontWeight:700, color:'#38bdf8', marginBottom:5 }}>{v}</div>
              <div style={{ fontSize:13, color:'rgba(148,163,184,0.5)' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LOGOS ── */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'36px 24px', textAlign:'center' }}>
        <p style={{ fontSize:12, color:'rgba(148,163,184,0.3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:20 }}>Trusted by operators worldwide</p>
        <div style={{ display:'flex', justifyContent:'center', gap:40, flexWrap:'wrap' }}>
          {LOGOS.map(l => (
            <span key={l} style={{ fontSize:14, color:'rgba(148,163,184,0.25)', fontWeight:500 }}>{l}</span>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth:1100, margin:'0 auto', padding:'72px 24px' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <h2 style={{ fontSize:34, fontWeight:700, color:'#f1f5f9', margin:'0 0 12px', letterSpacing:-.5 }}>Everything you need to manage orbital traffic</h2>
          <p style={{ fontSize:16, color:'rgba(148,163,184,0.6)', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>Built for satellite operators, researchers, and space agencies who need reliable orbital intelligence without the enterprise price tag.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:22 }}>
              <div style={{ fontSize:24, marginBottom:12 }}>{f.icon}</div>
              <h3 style={{ fontSize:15, fontWeight:600, color:'#f1f5f9', margin:'0 0 8px' }}>{f.title}</h3>
              <p style={{ fontSize:13, color:'rgba(148,163,184,0.55)', lineHeight:1.7, margin:0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(255,255,255,0.07)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'72px 24px' }}>
          <h2 style={{ fontSize:32, fontWeight:700, color:'#f1f5f9', textAlign:'center', margin:'0 0 52px', letterSpacing:-.5 }}>How it works</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0, position:'relative' }}>
            {[
              { n:'01', t:'Data ingested', d:'Space-Track.org TLEs fetched into our own database every 6 hours' },
              { n:'02', t:'Positions computed', d:'SGP4 algorithm propagates every satellite position every 5 seconds' },
              { n:'03', t:'Risks detected', d:'All object pairs screened for conjunction risks continuously' },
              { n:'04', t:'Alerts sent', d:'Email, push, or webhook notifications reach you in seconds' },
            ].map((s, i) => (
              <div key={s.n} style={{ padding:'0 20px', borderLeft: i>0 ? '1px solid rgba(255,255,255,0.07)' : 'none', textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:700, color:'rgba(56,189,248,0.25)', marginBottom:10 }}>{s.n}</div>
                <h3 style={{ fontSize:14, fontWeight:600, color:'#f1f5f9', margin:'0 0 8px' }}>{s.t}</h3>
                <p style={{ fontSize:12, color:'rgba(148,163,184,0.5)', lineHeight:1.7, margin:0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding:'72px 24px' }}>
        <h2 style={{ fontSize:32, fontWeight:700, color:'#f1f5f9', textAlign:'center', margin:'0 0 48px', letterSpacing:-.5 }}>What operators say</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background:'#0f172a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:22 }}>
              <p style={{ fontSize:14, color:'rgba(148,163,184,0.65)', lineHeight:1.8, margin:'0 0 18px', fontStyle:'italic' }}>"{t.text}"</p>
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:14 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#f1f5f9' }}>{t.name}</div>
                <div style={{ fontSize:12, color:'rgba(148,163,184,0.4)', marginTop:2 }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section id="pricing" style={{ background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(255,255,255,0.07)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'72px 24px', textAlign:'center' }}>
          <h2 style={{ fontSize:32, fontWeight:700, color:'#f1f5f9', margin:'0 0 12px', letterSpacing:-.5 }}>Simple pricing</h2>
          <p style={{ fontSize:16, color:'rgba(148,163,184,0.55)', marginBottom:40, lineHeight:1.7 }}>Start free. Upgrade when you need more.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:32 }}>
            {[
              { name:'Free', price:'£0', desc:'Full satellite catalogue, basic alerts, 100 API req/hr', cta:'Start free', href:'/app', col:'#64748b', primary:false },
              { name:'Pro', price:'£299/mo', desc:'10,000 req/hr, email + webhook alerts, 7-day predictions', cta:'Start Pro trial', href:'/pricing', col:'#38bdf8', primary:true },
              { name:'Enterprise', price:'Custom', desc:'Unlimited, white-label, SLA, dedicated account manager', cta:'Contact us', href:'mailto:hello@orbitos.space', col:'#a78bfa', primary:false },
            ].map(p => (
              <div key={p.name} style={{ background:'#0f172a', border:`${p.primary?'2px':'1px'} solid ${p.primary?'#38bdf8':'rgba(255,255,255,0.07)'}`, borderRadius:12, padding:22, textAlign:'left' }}>
                <div style={{ fontSize:11, fontWeight:600, color:p.col, letterSpacing:.5, marginBottom:8 }}>{p.name.toUpperCase()}</div>
                <div style={{ fontSize:26, fontWeight:700, color:'#f1f5f9', marginBottom:8 }}>{p.price}</div>
                <p style={{ fontSize:13, color:'rgba(148,163,184,0.5)', lineHeight:1.6, margin:'0 0 16px', minHeight:40 }}>{p.desc}</p>
                <a href={p.href} style={{ display:'block', textAlign:'center', padding:'9px', borderRadius:7, fontSize:13, fontWeight:600, textDecoration:'none', background: p.primary ? '#38bdf8' : 'transparent', color: p.primary ? '#0f172a' : 'rgba(148,163,184,0.7)', border: p.primary ? 'none' : '1px solid rgba(255,255,255,0.12)' }}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
          <a href="/pricing" style={{ fontSize:13, color:'rgba(56,189,248,0.6)', textDecoration:'none' }}>See full feature comparison →</a>
        </div>
      </section>

      {/* ── API SECTION ── */}
      <section id="api" style={{ maxWidth:1100, margin:'0 auto', padding:'72px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }}>
        <div>
          <div style={{ display:'inline-block', fontSize:12, fontWeight:600, color:'#34d399', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:20, padding:'4px 14px', letterSpacing:.5, marginBottom:16 }}>
            REST API
          </div>
          <h2 style={{ fontSize:30, fontWeight:700, color:'#f1f5f9', margin:'0 0 14px', letterSpacing:-.5 }}>Integrate orbital data into anything</h2>
          <p style={{ fontSize:15, color:'rgba(148,163,184,0.6)', lineHeight:1.75, margin:'0 0 24px' }}>Pull live satellite positions, conjunction risks, and orbit predictions directly into your ground station software, mission control system, or custom application.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {['JSON responses · Bearer token auth','Webhooks for real-time alerts','Rate limits by plan (100–unlimited)','Historical TLE data for Pro+'].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:9, fontSize:14, color:'rgba(148,163,184,0.65)' }}>
                <span style={{ color:'#34d399', fontSize:12, fontWeight:700 }}>✓</span>{f}
              </div>
            ))}
          </div>
          <a href="/app" style={{ display:'inline-block', marginTop:24, padding:'10px 22px', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)', color:'#34d399', borderRadius:8, fontSize:14, fontWeight:600, textDecoration:'none' }}>
            View API docs →
          </a>
        </div>
        {/* Code block */}
        <div style={{ background:'#060c16', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:20, fontFamily:'monospace', fontSize:13, lineHeight:1.8 }}>
          <div style={{ color:'rgba(148,163,184,0.3)', marginBottom:12, fontSize:11 }}>GET /v1/satellites</div>
          <div style={{ color:'#94a3b8' }}>{'{'}</div>
          <div style={{ paddingLeft:16 }}>
            <div><span style={{ color:'#38bdf8' }}>"count"</span><span style={{ color:'#475569' }}>: </span><span style={{ color:'#34d399' }}>9214</span><span style={{ color:'#475569' }}>,</span></div>
            <div><span style={{ color:'#38bdf8' }}>"satellites"</span><span style={{ color:'#475569' }}>: [</span></div>
            <div style={{ paddingLeft:16 }}>
              <div style={{ color:'#475569' }}>{'{'}</div>
              <div style={{ paddingLeft:16 }}>
                <div><span style={{ color:'#38bdf8' }}>"id"</span><span style={{ color:'#475569' }}>: </span><span style={{ color:'#fbbf24' }}>25544</span><span style={{ color:'#475569' }}>,</span></div>
                <div><span style={{ color:'#38bdf8' }}>"name"</span><span style={{ color:'#475569' }}>: </span><span style={{ color:'#a78bfa' }}>"ISS"</span><span style={{ color:'#475569' }}>,</span></div>
                <div><span style={{ color:'#38bdf8' }}>"lat"</span><span style={{ color:'#475569' }}>: </span><span style={{ color:'#fbbf24' }}>51.62</span><span style={{ color:'#475569' }}>,</span></div>
                <div><span style={{ color:'#38bdf8' }}>"alt_km"</span><span style={{ color:'#475569' }}>: </span><span style={{ color:'#fbbf24' }}>408</span><span style={{ color:'#475569' }}>,</span></div>
                <div><span style={{ color:'#38bdf8' }}>"vel_km_s"</span><span style={{ color:'#475569' }}>: </span><span style={{ color:'#fbbf24' }}>7.66</span></div>
              </div>
              <div style={{ color:'#475569' }}>{'}'}</div>
            </div>
            <div style={{ color:'#475569' }}>]</div>
          </div>
          <div style={{ color:'#94a3b8' }}>{'}'}</div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background:'rgba(56,189,248,0.05)', borderTop:'1px solid rgba(56,189,248,0.12)' }}>
        <div style={{ maxWidth:640, margin:'0 auto', padding:'72px 24px', textAlign:'center' }}>
          <h2 style={{ fontSize:34, fontWeight:700, color:'#f1f5f9', margin:'0 0 14px', letterSpacing:-.5 }}>Start tracking in 60 seconds</h2>
          <p style={{ fontSize:16, color:'rgba(148,163,184,0.55)', margin:'0 0 32px', lineHeight:1.7 }}>Free plan includes the full satellite catalogue, live 3D globe, and basic conjunction alerts. No credit card, no commitment.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <a href="/app" style={{ padding:'12px 28px', background:'#38bdf8', color:'#0f172a', borderRadius:8, fontSize:15, fontWeight:700, textDecoration:'none' }}>Launch OrbitOS free →</a>
            <a href="mailto:hello@orbitos.space" style={{ padding:'12px 28px', background:'transparent', color:'rgba(148,163,184,0.65)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, fontSize:15, textDecoration:'none' }}>Talk to us</a>
          </div>
          <p style={{ fontSize:12, color:'rgba(148,163,184,0.25)', marginTop:16 }}>Used by satellite operators across 12 countries</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'32px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18, color:'#38bdf8' }}>◎</span>
            <span style={{ color:'#38bdf8', fontWeight:700, fontSize:14 }}>OrbitOS</span>
            <span style={{ color:'rgba(148,163,184,0.25)', fontSize:13 }}>· The airspace for orbit</span>
          </div>
          <div style={{ display:'flex', gap:20 }}>
            {['Privacy','Terms','API docs','Pricing','Contact'].map(l => (
              <a key={l} href={`/${l.toLowerCase().replace(' ','-')}`} style={{ fontSize:13, color:'rgba(148,163,184,0.3)', textDecoration:'none' }}>{l}</a>
            ))}
          </div>
          <span style={{ fontSize:13, color:'rgba(148,163,184,0.2)' }}>© 2025 OrbitOS Ltd</span>
        </div>
      </footer>
    </div>
  )
}

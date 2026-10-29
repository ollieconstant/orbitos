import { useEffect, useRef } from 'react'
import { landDots } from './landGeo.js'
import { CSS, Arrow, useReveal, SiteNav, SiteFooter } from './site.jsx'

/* ─────────────────────────────────────────────────────────────
   OrbitOS landing — defence-grade aesthetic
   Near-black, hairline grids, monospace telemetry, one signal colour.
   ───────────────────────────────────────────────────────────── */


/* ── Globe: dot-matrix Earth, orbital shells, tracked objects, a live conjunction ── */
const ER = 6371, MU = 398600.4418
const dispR = alt => 1 + 0.115 * Math.log2(1 + alt / 380)       // compress altitude so GEO stays on screen
const omega = alt => (2 * Math.PI) / ((2 * Math.PI * Math.sqrt((ER + alt) ** 3 / MU)) / 95) // real periods, sped up 95×

function makeObjects() {
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const objs = []
  const add = (alt, inc, raan, u, kind = 0) => objs.push({ r: dispR(alt), inc, raan, u, w: omega(alt), kind })
  // Mega-constellation shells
  for (let p = 0; p < 18; p++) for (let s = 0; s < 22; s++) add(550, 53 * Math.PI / 180, p * (Math.PI * 2 / 18), s * (Math.PI * 2 / 22) + p * 0.12)
  for (let p = 0; p < 8; p++) for (let s = 0; s < 16; s++) add(1200, 87.9 * Math.PI / 180, p * (Math.PI / 8), s * (Math.PI * 2 / 16))
  // Debris & misc LEO
  for (let i = 0; i < 380; i++) add(350 + rnd() * 1300, (rnd() * 100) * Math.PI / 180, rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() < 0.35 ? 2 : 0)
  // MEO navigation
  for (let p = 0; p < 6; p++) for (let s = 0; s < 5; s++) add(20200, 55 * Math.PI / 180, p * Math.PI / 3, s * (Math.PI * 2 / 5) + p * 0.4)
  // GEO belt
  for (let i = 0; i < 80; i++) add(35786, (rnd() * 1.5) * Math.PI / 180, 0, rnd() * Math.PI * 2)
  return objs
}

function eci(o, t, out) {
  const u = o.u + o.w * t, cu = Math.cos(u), su = Math.sin(u)
  const cO = Math.cos(o.raan), sO = Math.sin(o.raan), ci = Math.cos(o.inc), si = Math.sin(o.inc)
  // node vector e1 = (cosΩ,0,-sinΩ); in-plane normal e2 = cos i·(-sinΩ,0,-cosΩ) + sin i·ŷ
  out[0] = o.r * (cu * cO - su * ci * sO)
  out[1] = o.r * (su * si)
  out[2] = o.r * (-cu * sO - su * ci * cO)
  return out
}

function OrbitalGlobe() {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    const land = landDots(1.55)
    const objs = makeObjects()
    // Tracked objects with drawn orbits, plus a conjunction pair sharing a node
    const D = Math.PI / 180
    const mk = (alt, inc, raan, u, label) => ({ r: dispR(alt), inc: inc * D, raan, u, label, w: omega(alt) })
    const trk = [
      mk(420, 51.6, 0.9, 0.6, 'TRK-0001 · LEO 420 KM'),
      mk(780, 98.6, 2.4, 2.2, 'TRK-0417 · SSO 780 KM'),
      mk(20200, 55, 4.1, 1.0, 'TRK-2210 · MEO 20,200 KM'),
    ]
    // Same altitude and node, different inclinations: they converge at the node every half orbit
    const cjA = mk(610, 72, 5.3, -1.2)
    const cjB = mk(610, 41, 5.3, -1.194)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0, H = 0, cx = 0, cy = 0, R = 0, dpr = 1, raf = 0, visible = true
    const t0 = performance.now()

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = cv.clientWidth; H = cv.clientHeight
      cv.width = W * dpr; cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (W < 720) { cx = W * 0.5; R = Math.min(W * 0.36, 210); cy = R * 1.95 + 20 }
      else { cx = W * 0.7; cy = H * 0.5; R = Math.min(W * 0.21, H * 0.3) }
    }
    size()
    window.addEventListener('resize', size)

    const p = [0, 0, 0]
    let ca = 1, sa = 0, cb = 1, sb = 0
    const view = (x, y, z, s) => {
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca
      const y2 = y * cb - z1 * sb, z2 = y * sb + z1 * cb
      s[0] = cx + x1 * R; s[1] = cy - y2 * R; s[2] = z2; s[3] = Math.hypot(x1, y2)
      return s
    }
    const sp = [0, 0, 0, 0], sq = [0, 0, 0, 0]
    const hidden = s => s[2] < 0 && s[3] < 1   // behind Earth's disc

    function label(x, y, text, col, align = 1) {
      ctx.strokeStyle = col; ctx.lineWidth = 1
      const L = 9
      ctx.beginPath()
      ;[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => {
        ctx.moveTo(x + a * L, y + b * (L - 4)); ctx.lineTo(x + a * L, y + b * L); ctx.lineTo(x + a * (L - 4), y + b * L)
      })
      ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x + align * L, y - L); ctx.lineTo(x + align * 30, y - 28); ctx.lineTo(x + align * 44, y - 28); ctx.stroke()
      ctx.fillStyle = col; ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace'
      ctx.textAlign = align > 0 ? 'left' : 'right'; ctx.textBaseline = 'middle'
      ctx.fillText(text, x + align * 50, y - 28)
    }

    function orbitPath(o, alpha) {
      const q = { ...o }
      ctx.lineWidth = 1
      let prev = null
      for (let i = 0; i <= 160; i++) {
        q.u = (i / 160) * Math.PI * 2
        q.w = 0
        eci(q, 0, p); view(p[0], p[1], p[2], sp)
        const h = hidden(sp)
        if (prev && !h && !prev.h) {
          ctx.strokeStyle = `rgba(237,237,234,${alpha * (sp[2] < 0 ? 0.35 : 1)})`
          ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(sp[0], sp[1]); ctx.stroke()
        }
        prev = { x: sp[0], y: sp[1], h }
      }
    }

    function frame(now) {
      const t = reduce ? 40 : (now - t0) / 1000
      const spin = -1.6 + t * 0.035, tilt = 0.32
      ca = Math.cos(spin); sa = Math.sin(spin); cb = Math.cos(tilt); sb = Math.sin(tilt)
      ctx.clearRect(0, 0, W, H)

      // Atmosphere glow + disc
      const g = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.35)
      g.addColorStop(0, 'rgba(125,211,252,0.10)'); g.addColorStop(1, 'rgba(125,211,252,0)')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2); ctx.fill()
      const d = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R)
      d.addColorStop(0, '#111417'); d.addColorStop(1, '#060708')
      ctx.fillStyle = d; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()

      // Graticule
      ctx.lineWidth = 1
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath(); let first = true
        for (let lo = 0; lo <= 360; lo += 4) {
          const la = lat * Math.PI / 180, l = lo * Math.PI / 180
          view(Math.cos(la) * Math.cos(l), Math.sin(la), -Math.cos(la) * Math.sin(l), sp)
          if (sp[2] < 0) { first = true; continue }
          first ? ctx.moveTo(sp[0], sp[1]) : ctx.lineTo(sp[0], sp[1]); first = false
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.stroke()
      }

      // Land dots
      const ds = Math.max(1, R / 230)
      for (let i = 0; i < land.length; i++) {
        const v = land[i]
        view(v[0], v[1], v[2], sp)
        if (sp[2] <= 0.02) continue
        ctx.fillStyle = `rgba(237,237,234,${0.12 + sp[2] * 0.62})`
        ctx.fillRect(sp[0] - ds * 0.6, sp[1] - ds * 0.6, ds * 1.2, ds * 1.2)
      }
      // Rim
      ctx.strokeStyle = 'rgba(237,237,234,0.18)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()

      // Orbital population
      for (let i = 0; i < objs.length; i++) {
        const o = objs[i]
        eci(o, t, p); view(p[0], p[1], p[2], sp)
        if (hidden(sp)) continue
        const a = sp[2] < 0 ? 0.22 : 0.75
        ctx.fillStyle = o.kind === 2 ? `rgba(154,158,165,${a * 0.8})` : `rgba(200,236,255,${a})`
        const s = o.r > 1.6 ? 1.6 : 1.3
        ctx.fillRect(sp[0] - s / 2, sp[1] - s / 2, s, s)
      }

      // Tracked objects
      trk.forEach((o, i) => {
        orbitPath(o, 0.16)
        eci(o, t, p); view(p[0], p[1], p[2], sp)
        if (hidden(sp)) return
        ctx.fillStyle = '#ededea'; ctx.fillRect(sp[0] - 2, sp[1] - 2, 4, 4)
      })

      // Conjunction pair
      orbitPath(cjA, 0.1); orbitPath(cjB, 0.1)
      eci(cjA, t, p); view(p[0], p[1], p[2], sp)
      eci(cjB, t, p); view(p[0], p[1], p[2], sq)
      const dist = Math.hypot(sp[0] - sq[0], sp[1] - sq[1])
      if (!hidden(sp)) {
        const close = dist < R * 0.35
        ctx.fillStyle = close ? '#ff5a1f' : '#ededea'
        ctx.fillRect(sp[0] - 2, sp[1] - 2, 4, 4)
        if (!hidden(sq)) ctx.fillRect(sq[0] - 2, sq[1] - 2, 4, 4)
        if (close) {
          const ph = (t * 1.6) % 1
          ctx.strokeStyle = `rgba(255,90,31,${0.7 * (1 - ph)})`
          ctx.beginPath(); ctx.arc((sp[0] + sq[0]) / 2, (sp[1] + sq[1]) / 2, 8 + ph * 26, 0, Math.PI * 2); ctx.stroke()
          ctx.setLineDash([2, 3]); ctx.strokeStyle = 'rgba(255,90,31,0.8)'
          ctx.beginPath(); ctx.moveTo(sp[0], sp[1]); ctx.lineTo(sq[0], sq[1]); ctx.stroke(); ctx.setLineDash([])
        }
      }

      if (!reduce && visible) raf = requestAnimationFrame(frame)
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(frame)
    })
    io.observe(cv)
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('resize', size) }
  }, [])
  return <canvas ref={ref} aria-hidden="true" />
}

/* ── small pieces ── */

const Glyph = {
  globe: <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="22" cy="22" r="17" /><ellipse cx="22" cy="22" rx="7" ry="17" /><path d="M5 22h34M8 13h28M8 31h28" /></svg>,
  conj: <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1"><path d="M4 34C14 22 26 16 40 12" /><path d="M4 10c12 6 22 14 36 24" /><circle cx="22" cy="20.5" r="5" stroke="#ff5a1f" /><circle cx="22" cy="20.5" r="10" stroke="#ff5a1f" strokeOpacity=".35" /></svg>,
  prop: <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="22" cy="22" r="6" /><ellipse cx="22" cy="22" rx="19" ry="9" /><circle cx="39" cy="20" r="2" fill="currentColor" /><path d="M22 3v4M22 37v4" strokeDasharray="1 2" /></svg>,
  alert: <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 6 40 38H4Z" /><path d="M22 17v10M22 31v2" /></svg>,
  data: <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1"><ellipse cx="22" cy="10" rx="15" ry="5" /><path d="M7 10v24c0 2.8 6.7 5 15 5s15-2.2 15-5V10M7 22c0 2.8 6.7 5 15 5s15-2.2 15-5" /></svg>,
  api: <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1"><path d="M15 12 5 22l10 10M29 12l10 10-10 10M25 8l-6 28" /></svg>,
}

const CAPS = [
  { k: 'globe', tag: 'Tracking', t: 'A live operating picture of orbit', d: 'Every catalogued payload, rocket body and debris fragment, propagated and rendered in real time. Select any object to see its orbit and state.' },
  { k: 'conj', tag: 'Screening', t: 'Collision risk, before it becomes a headline', d: 'Object pairs are screened for close approaches every five seconds. Anything that crosses your threshold is flagged and escalated.' },
  { k: 'prop', tag: 'Propagation', t: 'SGP4 at the core', d: 'The standard model behind public space-surveillance catalogues, running against fresh element sets for every object.' },
  { k: 'alert', tag: 'Alerting', t: 'Warnings that reach the right people', d: 'Email, push and webhook delivery, so a warning lands in the systems your team already watches.' },
  { k: 'data', tag: 'Catalogue', t: 'Our own orbital database', d: 'Element sets ingested every six hours from public space-surveillance sources into the OrbitOS catalogue.' },
  { k: 'api', tag: 'Interface', t: 'Built to integrate', d: 'A keyed REST API with clear rate limits. Pull orbital data straight into mission software and ground systems.' },
]

const STAGES = [
  { n: '01', t: 'Ingest', d: 'Fresh element sets pulled into the OrbitOS catalogue.', s: 'Every 6 h' },
  { n: '02', t: 'Propagate', d: 'SGP4 computes a current state vector for every object.', s: 'Continuous' },
  { n: '03', t: 'Screen', d: 'Object pairs checked for close approaches against your thresholds.', s: 'Every 5 s' },
  { n: '04', t: 'Alert', d: 'Warnings delivered by email, push or webhook.', s: 'Seconds' },
]

const OPS = [
  { n: 'A', t: 'Commercial constellations', d: 'Screen hundreds of spacecraft at once instead of chasing close approaches one by one.' },
  { n: 'B', t: 'Government & defence', d: 'An independent, continuously updated picture of the orbital domain.' },
  { n: 'C', t: 'Civil space agencies', d: 'Watch national assets in the context of everything around them.' },
  { n: 'D', t: 'Universities & CubeSats', d: 'Professional-grade awareness on the free plan. No procurement cycle.' },
]

export default function Landing() {
  useReveal()

  return (
    <div className="ox">
      <style>{CSS}</style>

      <SiteNav />

      {/* HERO */}
      <header className="ox-hero">
        <div className="ox-grid-bg" />
        <OrbitalGlobe />
        <div className="ox-hero-fade" />
        <div className="ox-wrap ox-hero-in">
          <h1 className="ox-h1 ox-r ox-d1">Command the<br />orbital <em>domain.</em></h1>
          <p className="ox-lede ox-r ox-d2">OrbitOS tracks every catalogued object in Earth orbit, screens for collisions continuously, and alerts operators before a close approach becomes a debris field.</p>
          <div className="ox-ctas ox-r ox-d3">
            <a href="/app" className="ox-btn pri">Launch platform <Arrow /></a>
            <a href="mailto:hello@orbitos.space?subject=OrbitOS%20briefing" className="ox-btn sec">Request a briefing</a>
          </div>
        </div>
      </header>


      {/* PROBLEM */}
      <section className="ox-sec">
        <div className="ox-wrap">
          <h2 className="ox-h2 ox-r ox-d1">Orbit is critical infrastructure. <em>It still has no air traffic control.</em></h2>
          <div className="ox-two">
            <p className="ox-p ox-r ox-d2">Navigation, communications, weather, finance and defence all depend on satellites sharing the same narrow bands of altitude. Launch rates keep climbing, and every new spacecraft adds to the traffic.</p>
            <p className="ox-p ox-r ox-d3">In 2009, Iridium 33 and Cosmos 2251 collided at roughly 11.7 km/s and left more than 2,000 trackable fragments. <strong>OrbitOS exists so the next one is seen coming.</strong></p>
          </div>
          <div className="ox-band">
            <div className="ox-r"><div className="ox-mono ox-dim">Objects catalogued</div><div className="ox-big">27,000+</div><p className="ox-p" style={{ fontSize: 15 }}>Payloads, rocket bodies and debris in a single picture.</p></div>
            <div className="ox-r ox-d1"><div className="ox-mono ox-dim">Screening cycle</div><div className="ox-big">5 s</div><p className="ox-p" style={{ fontSize: 15 }}>Close-approach checks run continuously, not once a day.</p></div>
            <div className="ox-r ox-d2"><div className="ox-mono ox-dim">Closing speed, 2009 collision</div><div className="ox-big sig">11.7 km/s</div><p className="ox-p" style={{ fontSize: 15 }}>There's no time to react once it's close. Prediction is the only defence.</p></div>
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section className="ox-sec" id="platform">
        <div className="ox-wrap">
          <h2 className="ox-h2 ox-r ox-d1">One picture. Every object. <em>Continuously.</em></h2>
          <div className="ox-caps">
            {CAPS.map((c, i) => (
              <article className={'ox-cap ox-r ox-d' + (i % 3)} key={c.k}>
                {Glyph[c.k]}
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="ox-sec" id="pipeline">
        <div className="ox-wrap">
          <h2 className="ox-h2 ox-r ox-d1">From raw element sets to a decision, <em>in seconds.</em></h2>
          <div className="ox-pipe">
            <div className="ox-pipe-line" />
            {STAGES.map((s, i) => (
              <div className={'ox-stage ox-r ox-d' + (i + 1)} key={s.n}>
                <div className="ox-node" />
                <h4>{s.t}</h4>
                <p>{s.d}</p>
                <span className="ox-spec ox-mono">{s.s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPERATORS */}
      <section className="ox-sec" id="operators">
        <div className="ox-wrap">
          <h2 className="ox-h2 ox-r ox-d1">Built for everyone who flies in orbit. <em>From CubeSats to constellations.</em></h2>
          <div className="ox-ops">
            {OPS.map((o, i) => (
              <div className={'ox-op ox-r ox-d' + (i + 1)} key={o.n}>
                <h3>{o.t}</h3>
                <p>{o.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API */}
      <section className="ox-sec" id="api">
        <div className="ox-wrap ox-api">
          <div>
            <h2 className="ox-h2 ox-r ox-d1" style={{ fontSize: 'clamp(34px,4vw,60px)' }}>Put the picture inside your <em>ground segment.</em></h2>
            <ul className="ox-list ox-r ox-d2">
              <li><span>Authentication</span><span>BEARER · ORB_ KEYS</span></li>
              <li><span>Format</span><span>JSON · TLE</span></li>
              <li><span>Free plan</span><span>100 REQ / HOUR</span></li>
              <li><span>Pro plan</span><span>10,000 REQ / HOUR</span></li>
            </ul>
          </div>
          <div className="ox-term ox-r ox-d2">
            <div className="ox-term-hd ox-mono ox-dim"><span>GET /api/v1/satellites</span><span style={{ color: 'var(--live)' }}>200 OK</span></div>
            <pre>
<span className="c"># Current element sets for crewed stations</span>{'\n'}
<span className="k">curl</span> <span className="s">"https://orbitos-8n5.pages.dev/api/v1/satellites?category=stations&limit=1"</span> \{'\n'}
{'  '}-H <span className="s">"Authorization: Bearer orb_••••••••••••"</span>{'\n\n'}
{'{'}{'\n'}
{'  '}<span className="k">"count"</span>: <span className="n">1</span>,{'\n'}
{'  '}<span className="k">"plan"</span>: <span className="s">"pro"</span>,{'\n'}
{'  '}<span className="k">"satellites"</span>: [{'{'}{'\n'}
{'    '}<span className="k">"id"</span>: <span className="n">25544</span>,{'\n'}
{'    '}<span className="k">"name"</span>: <span className="s">"ISS (ZARYA)"</span>,{'\n'}
{'    '}<span className="k">"category"</span>: <span className="s">"stations"</span>,{'\n'}
{'    '}<span className="k">"tle1"</span>: <span className="s">"1 25544U 98067A   …"</span>,{'\n'}
{'    '}<span className="k">"tle2"</span>: <span className="s">"2 25544  51.6…"</span>,{'\n'}
{'    '}<span className="k">"epoch"</span>: <span className="s">"…"</span>{'\n'}
{'  '}{'}'}]{'\n'}
{'}'}
            </pre>
          </div>
        </div>
      </section>

      {/* CLOSE */}
      <section className="ox-close">
        <div className="ox-grid-bg" style={{ maskImage: 'radial-gradient(ellipse at 80% 60%,#000 0%,transparent 60%)', WebkitMaskImage: 'radial-gradient(ellipse at 80% 60%,#000 0%,transparent 60%)' }} />
        <div className="ox-wrap" style={{ position: 'relative' }}>
          <h2 className="ox-h2 ox-r ox-d1">See everything<br />in orbit. <em>Now.</em></h2>
          <p className="ox-lede ox-r ox-d2" style={{ marginTop: 40 }}>Free for research teams and CubeSat operators. Scales with your fleet.</p>
          <div className="ox-ctas ox-r ox-d3">
            <a href="/app" className="ox-btn pri">Launch platform <Arrow /></a>
            <a href="/pricing" className="ox-btn sec">View plans</a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

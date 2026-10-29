import { useState, useEffect } from 'react'

/* Shared marketing-site shell: styles, logo, nav and footer.
   Used by Landing.jsx and Pricing.jsx so both pages stay identical in look. */

export const CSS = `
.ox{--bg:#050607;--bg2:#0a0b0d;--bg3:#0f1113;--line:rgba(255,255,255,.08);--line2:rgba(255,255,255,.16);
  --fg:#ededea;--mut:#9a9ea5;--dim:#5d6168;--live:#7dd3fc;--sig:#ff5a1f;
  --sans:'Inter Tight','Inter',system-ui,-apple-system,sans-serif;--mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  background:var(--bg);color:var(--fg);font-family:var(--sans);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased}
.ox *{box-sizing:border-box}
.ox a{color:inherit;text-decoration:none}
.ox ::selection{background:var(--fg);color:var(--bg)}
.ox-wrap{max-width:1360px;margin:0 auto;padding:0 40px}
.ox-mono{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase}
.ox-dim{color:var(--dim)}.ox-mut{color:var(--mut)}

/* nav */
.ox-nav{position:fixed;inset:0 0 auto 0;z-index:60;height:64px;display:flex;align-items:center;transition:background .3s,border-color .3s;border-bottom:1px solid transparent}
.ox-nav.solid{background:rgba(5,6,7,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom-color:var(--line)}
.ox-nav .ox-wrap{display:flex;align-items:center;width:100%;gap:36px}
.ox-logo{display:flex;align-items:center;gap:12px;font-weight:600;letter-spacing:.32em;font-size:13px}
.ox-links{display:flex;gap:28px}
.ox-links a{color:var(--mut);transition:color .2s}.ox-links a:hover,.ox-links a.on{color:var(--fg)}
.ox-navr{margin-left:auto;display:flex;align-items:center;gap:22px}
.ox-btn{display:inline-flex;align-items:center;gap:12px;height:44px;padding:0 20px;font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;border:1px solid var(--fg);transition:background .2s,color .2s,border-color .2s;white-space:nowrap}
.ox-btn.pri{background:var(--fg);color:var(--bg)}.ox-btn.pri:hover{background:transparent;color:var(--fg)}
.ox-btn.sec{border-color:var(--line2);color:var(--fg)}.ox-btn.sec:hover{border-color:var(--fg)}
.ox-btn.sm{height:36px;padding:0 16px}
.ox-btn .arr{transition:transform .2s}.ox-btn:hover .arr{transform:translateX(4px)}

/* hero */
.ox-hero{position:relative;height:100vh;min-height:720px;max-height:1100px;overflow:hidden;border-bottom:1px solid var(--line)}
.ox-hero canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.ox-hero-fade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,var(--bg) 0%,rgba(5,6,7,.85) 30%,rgba(5,6,7,0) 60%),linear-gradient(0deg,var(--bg) 0%,rgba(5,6,7,0) 22%)}
.ox-grid-bg{position:absolute;inset:0;pointer-events:none;opacity:.5;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:120px 120px;mask-image:radial-gradient(ellipse at 70% 50%,#000 10%,transparent 70%);-webkit-mask-image:radial-gradient(ellipse at 70% 50%,#000 10%,transparent 70%)}
.ox-hero-in{position:relative;height:100%;display:flex;flex-direction:column;justify-content:center;padding-top:64px}
.ox-tag{display:inline-flex;align-items:center;gap:10px;color:var(--mut);margin-bottom:36px}
.ox-dot{width:6px;height:6px;border-radius:50%;background:var(--live);box-shadow:0 0 0 0 rgba(125,211,252,.6);animation:oxPulse 2s infinite}
@keyframes oxPulse{0%{box-shadow:0 0 0 0 rgba(125,211,252,.55)}70%{box-shadow:0 0 0 9px rgba(125,211,252,0)}100%{box-shadow:0 0 0 0 rgba(125,211,252,0)}}
.ox-h1{font-size:clamp(48px,7.4vw,118px);font-weight:500;line-height:.92;letter-spacing:-.045em;margin:0 0 32px;max-width:9.5em}
.ox-h1 em{font-style:normal;color:var(--dim)}
.ox-lede{font-size:clamp(16px,1.35vw,19px);line-height:1.6;color:var(--mut);max-width:30em;margin:0 0 44px}
.ox-ctas{display:flex;gap:12px;flex-wrap:wrap}
.ox-corner{position:absolute;width:18px;height:18px;border-color:var(--line2);border-style:solid;pointer-events:none}
.ox-hud{position:absolute;right:40px;top:96px;text-align:right;line-height:2;color:var(--dim)}
.ox-hud b{font-weight:400;color:var(--mut)}
.ox-telem{position:absolute;left:0;right:0;bottom:0;border-top:1px solid var(--line)}
.ox-telem .ox-wrap{display:grid;grid-template-columns:repeat(5,1fr)}
.ox-telem .cell{padding:22px 0 26px;border-left:1px solid var(--line);padding-left:20px}
.ox-telem .cell:first-child{border-left:0;padding-left:0}
.ox-telem .v{font-size:22px;letter-spacing:-.02em;margin-top:8px;font-weight:500}

/* ticker */
.ox-tick{border-bottom:1px solid var(--line);overflow:hidden;white-space:nowrap;background:var(--bg2)}
.ox-tick-in{display:inline-flex;animation:oxTick 60s linear infinite;padding:14px 0}
.ox-tick span{padding:0 28px;color:var(--dim)}.ox-tick i{font-style:normal;color:var(--live);margin-right:10px}
@keyframes oxTick{to{transform:translateX(-50%)}}

/* sections */
.ox-sec{padding:160px 0;border-bottom:1px solid var(--line);position:relative}
.ox-label{display:flex;align-items:center;gap:14px;color:var(--mut);margin-bottom:56px}
.ox-label::after{content:'';flex:0 0 64px;height:1px;background:var(--line2)}
.ox-h2{font-size:clamp(36px,5vw,76px);font-weight:500;line-height:1;letter-spacing:-.04em;margin:0;max-width:14em}
.ox-h2 em{font-style:normal;color:var(--dim)}
.ox-two{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:64px;max-width:980px;margin-left:auto}
.ox-p{font-size:17px;line-height:1.7;color:var(--mut);margin:0}
.ox-p strong{color:var(--fg);font-weight:500}

/* stat band */
.ox-band{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);margin-top:120px}
.ox-band>div{padding:40px 32px 0 0;border-right:1px solid var(--line)}
.ox-band>div+div{padding-left:32px}.ox-band>div:last-child{border-right:0}
.ox-big{font-size:clamp(44px,5vw,80px);font-weight:500;letter-spacing:-.05em;line-height:1;margin:18px 0 14px}
.ox-big.sig{color:var(--sig)}

/* capability grid */
.ox-caps{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);border-left:1px solid var(--line);margin-top:96px}
.ox-cap{position:relative;padding:40px 36px 48px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);min-height:340px;display:flex;flex-direction:column;transition:background .3s}
.ox-cap:hover{background:var(--bg2)}
.ox-cap .hd{display:flex;justify-content:space-between;color:var(--dim)}
.ox-cap svg{margin:0 0 auto;color:var(--fg)}
.ox-cap h3{font-size:24px;font-weight:500;letter-spacing:-.025em;margin:40px 0 12px;line-height:1.15}
.ox-cap p{font-size:15px;line-height:1.65;color:var(--mut);margin:0}
.ox-cap::before{content:'';position:absolute;left:-1px;top:-1px;width:0;height:1px;background:var(--fg);transition:width .5s}
.ox-cap:hover::before{width:calc(100% + 1px)}

/* pipeline */
.ox-pipe{position:relative;display:grid;grid-template-columns:repeat(4,1fr);margin-top:96px}
.ox-pipe-line{position:absolute;left:0;right:0;top:9px;height:1px;background:var(--line2);overflow:hidden}
.ox-pipe-line::after{content:'';position:absolute;top:0;left:-20%;width:20%;height:1px;background:linear-gradient(90deg,transparent,var(--live),transparent);animation:oxRun 3.2s linear infinite}
@keyframes oxRun{to{left:100%}}
.ox-stage{position:relative;padding-right:32px}
.ox-node{width:19px;height:19px;border:1px solid var(--fg);background:var(--bg);display:grid;place-items:center;margin-bottom:28px}
.ox-node::after{content:'';width:5px;height:5px;background:var(--fg)}
.ox-stage h4{font-size:30px;font-weight:500;letter-spacing:-.03em;margin:0 0 14px}
.ox-stage p{font-size:15px;line-height:1.65;color:var(--mut);margin:0;max-width:18em}
.ox-spec{display:inline-block;margin-top:24px;padding:6px 10px;border:1px solid var(--line2);color:var(--fg)}

/* operators */
.ox-ops{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);margin-top:96px}
.ox-op{padding:36px 28px 8px 0;border-right:1px solid var(--line)}
.ox-op+.ox-op{padding-left:28px}.ox-op:last-child{border-right:0}
.ox-op h3{font-size:22px;font-weight:500;letter-spacing:-.02em;margin:0 0 12px;line-height:1.2}
.ox-op p{font-size:15px;line-height:1.65;color:var(--mut);margin:0}

/* api */
.ox-api{display:grid;grid-template-columns:5fr 7fr;gap:80px;align-items:start}
.ox-term{border:1px solid var(--line2);background:var(--bg2);font-family:var(--mono);font-size:13px;line-height:1.75;overflow:hidden}
.ox-term-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid var(--line)}
.ox-term pre{margin:0;padding:22px 22px 26px;overflow-x:auto;color:var(--mut)}
.ox-term .k{color:var(--fg)}.ox-term .s{color:var(--live)}.ox-term .c{color:var(--dim)}.ox-term .n{color:#fbbf8a}
.ox-list{list-style:none;padding:0;margin:48px 0 0;border-top:1px solid var(--line)}
.ox-list li{display:flex;justify-content:space-between;gap:20px;padding:16px 0;border-bottom:1px solid var(--line);font-size:15px;color:var(--mut)}
.ox-list li span:last-child{color:var(--fg);font-family:var(--mono);font-size:12px;letter-spacing:.08em}

/* closing */
.ox-close{padding:200px 0 180px;text-align:left;position:relative;overflow:hidden;border-bottom:1px solid var(--line)}
.ox-close .ox-h2{font-size:clamp(48px,8.4vw,136px);max-width:none;letter-spacing:-.05em;line-height:.9}

/* footer */
.ox-foot{padding:64px 0 40px}
.ox-foot-top{display:flex;justify-content:space-between;gap:40px;flex-wrap:wrap}
.ox-foot-links{display:flex;gap:28px;flex-wrap:wrap}
.ox-foot-links a{color:var(--mut)}.ox-foot-links a:hover{color:var(--fg)}
.ox-mark{font-size:clamp(80px,19vw,300px);font-weight:600;letter-spacing:-.06em;line-height:.8;margin:96px 0 40px;color:transparent;-webkit-text-stroke:1px rgba(255,255,255,.13);user-select:none}
.ox-foot-bot{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;color:var(--dim)}

/* reveal */
.ox-r{opacity:0;transform:translateY(24px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
.ox-r.in{opacity:1;transform:none}
.ox-d1{transition-delay:.08s}.ox-d2{transition-delay:.16s}.ox-d3{transition-delay:.24s}.ox-d4{transition-delay:.32s}.ox-d5{transition-delay:.4s}

@media (prefers-reduced-motion:reduce){
  .ox-r{opacity:1;transform:none;transition:none}
  .ox-tick-in,.ox-pipe-line::after,.ox-dot{animation:none}
}
@media (max-width:1080px){
  .ox-links{display:none}
  .ox-caps{grid-template-columns:repeat(2,1fr)}
  .ox-ops{grid-template-columns:repeat(2,1fr)}
  .ox-op:nth-child(2){border-right:0}.ox-op:nth-child(3){padding-left:0}
  .ox-op:nth-child(n+3){border-top:1px solid var(--line);margin-top:32px}
  .ox-api{grid-template-columns:1fr;gap:56px}
  .ox-hud{display:none}
  .ox-telem .ox-wrap{grid-template-columns:repeat(3,1fr)}
  .ox-telem .cell:nth-child(n+4){display:none}
}
@media (max-width:720px){
  .ox-wrap{padding:0 20px}
  .ox-navr .signin{display:none}
  .ox-hero{height:auto;min-height:0;max-height:none}
  .ox-hero-in{justify-content:flex-start;padding-top:min(78vw,440px);padding-bottom:88px}
  .ox-hero-fade{background:linear-gradient(0deg,var(--bg) 0%,var(--bg) 46%,rgba(5,6,7,0) 72%)}
  .ox-telem .ox-wrap{grid-template-columns:repeat(2,1fr)}
  .ox-telem .cell:nth-child(n+3){display:none}
  .ox-telem .v{font-size:18px}
  .ox-sec{padding:104px 0}
  .ox-label{margin-bottom:36px}
  .ox-two{grid-template-columns:1fr;gap:24px;margin-top:48px}
  .ox-band{grid-template-columns:1fr;margin-top:72px}
  .ox-band>div,.ox-band>div+div{padding:28px 0;border-right:0;border-bottom:1px solid var(--line)}
  .ox-caps{grid-template-columns:1fr;margin-top:64px}
  .ox-cap{min-height:0;padding:32px 24px 36px}
  .ox-cap svg{margin:32px 0 0}
  .ox-pipe{grid-template-columns:1fr;gap:48px;margin-top:64px;padding-left:40px}
  .ox-pipe-line{left:9px;right:auto;top:0;bottom:0;width:1px;height:auto}
  .ox-pipe-line::after{display:none}
  .ox-node{position:absolute;left:-40px;top:0;margin:0}
  .ox-ops{grid-template-columns:1fr;margin-top:64px}
  .ox-op,.ox-op+.ox-op{padding:28px 0;border-right:0;border-top:1px solid var(--line);margin-top:0}
  .ox-op:first-child{border-top:0}
  .ox-term{font-size:11.5px}
  .ox-close{padding:128px 0 112px}
}
`

export function useUTC() {
  const [s, set] = useState(() => new Date().toISOString().slice(11, 19))
  useEffect(() => { const i = setInterval(() => set(new Date().toISOString().slice(11, 19)), 1000); return () => clearInterval(i) }, [])
  return s
}

export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.ox-r')
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [])
}

export const Logo = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <circle cx="12" cy="12" r="5" />
    <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(-28 12 12)" />
    <circle cx="21.2" cy="7.6" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

export const Arrow = () => <span className="arr">→</span>

export function SiteNav({ active }) {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 24)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  const link = (href, label) => <a href={href} className={active === label ? 'on' : undefined}>{label}</a>
  return (
      <nav className={'ox-nav' + (solid ? ' solid' : '')}>
        <div className="ox-wrap">
          <a href="/" className="ox-logo"><Logo />ORBITOS</a>
          <div className="ox-links ox-mono">
            {link('/#platform', 'Platform')}{link('/#pipeline', 'Pipeline')}{link('/#operators', 'Operators')}{link('/#api', 'API')}{link('/pricing', 'Pricing')}
          </div>
          <div className="ox-navr">
            <a href="/app" className="ox-mono ox-mut signin">Sign in</a>
            <a href="/app" className="ox-btn pri sm">Launch platform</a>
          </div>
        </div>
      </nav>
  )
}

export function SiteFooter() {
  return (
      <footer className="ox-foot">
        <div className="ox-wrap">
          <div className="ox-foot-top">
            <a href="/" className="ox-logo"><Logo />ORBITOS</a>
            <div className="ox-foot-links ox-mono">
              <a href="/app">Platform</a><a href="/pricing">Pricing</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@orbitos.space">Contact</a>
            </div>
          </div>
          <div className="ox-mark" aria-hidden="true">ORBITOS</div>
          <div className="ox-foot-bot ox-mono">
            <span>© {new Date().getFullYear()} OrbitOS Ltd</span>
          </div>
        </div>
      </footer>
  )
}

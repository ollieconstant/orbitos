import { useState } from 'react'
import { CSS, Arrow, useReveal, SiteNav, SiteFooter } from './site.jsx'

const PLANS = [
  {
    tier: '01', name: 'Free', price: { monthly: 0, annual: 0 },
    desc: 'For researchers, students and CubeSat teams exploring orbital data.',
    features: ['100 API requests / hour', 'Live satellite tracking', 'Full 27,000+ catalogue', '3D & 2D operating picture', 'Basic conjunction alerts', 'Community support'],
    missing: ['Email & push alerts', 'Webhook notifications', 'Orbit path prediction', 'API key & dashboard', 'SLA guarantee'],
    cta: 'Start for free', href: '/app',
  },
  {
    tier: '02', name: 'Pro', price: { monthly: 299, annual: 249 }, popular: true,
    desc: 'For satellite operators who need reliable conjunction data.',
    features: ['10,000 API requests / hour', 'Live satellite tracking', 'Full 27,000+ catalogue', '3D & 2D operating picture', 'Real-time conjunction alerts', 'Email & push notifications', 'Webhook delivery', '7-day orbit prediction', 'API key & usage dashboard', 'Priority support (24 h)', 'Custom alert thresholds'],
    missing: ['SLA guarantee'],
    cta: 'Start Pro trial', href: '/app',
  },
  {
    tier: '03', name: 'Enterprise', price: { monthly: null, annual: null },
    desc: 'For agencies, launch providers and governments.',
    features: ['Unlimited API requests', 'Full 27,000+ catalogue', 'Real-time conjunction alerts', 'Email, push & webhook alerts', '30-day orbit prediction', 'Dedicated API infrastructure', 'White-label licensing', 'Custom integrations', '99.9% uptime SLA', 'Dedicated account manager'],
    missing: [],
    cta: 'Request a briefing', href: 'mailto:hello@orbitos.space?subject=OrbitOS%20Enterprise',
  },
]

const FAQS = [
  { q: 'Can I cancel at any time?', a: 'Yes. Pro plans can be cancelled any time from your dashboard. You keep access until the end of your billing period.' },
  { q: 'How accurate is the conjunction data?', a: 'OrbitOS propagates every object with SGP4, the standard model behind public satellite catalogues. Position accuracy is typically within 1–10 km for LEO objects, with element sets refreshed every 6 hours.' },
  { q: 'Do you offer student or academic discounts?', a: 'Yes — universities and research institutions get 50% off Pro. Email us from your institutional address.' },
  { q: 'Can I integrate OrbitOS into my ground station software?', a: 'Yes. Pro and Enterprise include full REST API access, with webhooks for real-time conjunction alerts.' },
]

const PCSS = `
.op-head{padding:180px 0 96px;border-bottom:1px solid var(--line);position:relative;overflow:hidden}
.op-head .ox-grid-bg{mask-image:radial-gradient(ellipse at 85% 30%,#000 0%,transparent 60%);-webkit-mask-image:radial-gradient(ellipse at 85% 30%,#000 0%,transparent 60%)}
.op-headrow{display:flex;justify-content:space-between;align-items:flex-end;gap:40px;flex-wrap:wrap;position:relative}
.op-toggle{display:inline-flex;border:1px solid var(--line2)}
.op-toggle button{height:40px;padding:0 18px;background:transparent;border:0;color:var(--mut);font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:10px;transition:background .15s,color .15s}
.op-toggle button+button{border-left:1px solid var(--line2)}
.op-toggle button.on{background:var(--fg);color:var(--bg)}
.op-toggle em{font-style:normal;color:var(--live)}
.op-toggle button.on em{color:var(--bg);opacity:.6}

.op-plans{display:grid;grid-template-columns:repeat(3,1fr);border-left:1px solid var(--line);border-top:1px solid var(--line);margin-top:96px}
.op-plan{position:relative;display:flex;flex-direction:column;padding:36px 32px 40px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.op-plan.pop{background:var(--bg2)}
.op-plan.pop::before{content:'';position:absolute;left:-1px;right:-1px;top:-1px;height:2px;background:var(--fg)}
.op-plan .hd{display:flex;justify-content:space-between;color:var(--dim)}
.op-plan .hd .rec{color:var(--fg)}
.op-plan h3{font-size:28px;font-weight:500;letter-spacing:-.03em;margin:0 0 14px}
.op-plan .hd{position:absolute;top:18px;right:24px}
.op-price{display:flex;align-items:baseline;gap:6px;min-height:72px}
.op-price .n{font-size:68px;font-weight:500;letter-spacing:-.05em;line-height:1;font-variant-numeric:tabular-nums}
.op-price .u{color:var(--mut);font-size:15px}
.op-billed{min-height:22px;margin-top:10px;color:var(--dim)}
.op-plan p.d{font-size:15px;line-height:1.6;color:var(--mut);margin:18px 0 28px;min-height:48px}
.op-plan .ox-btn{justify-content:center;width:100%}
.op-feats{list-style:none;margin:32px 0 0;padding:28px 0 0;border-top:1px solid var(--line)}
.op-feats li{display:flex;gap:14px;align-items:baseline;font-size:14.5px;line-height:1.45;padding:7px 0;color:var(--fg)}
.op-feats li span{font-family:var(--mono);font-size:11px;color:var(--live);width:10px;flex-shrink:0}
.op-feats li.no{color:var(--dim)}
.op-feats li.no span{color:var(--dim)}

.op-band{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-top:120px}
.op-band>div{padding:36px 28px 40px 0;border-right:1px solid var(--line)}
.op-band>div+div{padding-left:28px}.op-band>div:last-child{border-right:0}
.op-band .v{font-size:clamp(34px,3.6vw,56px);font-weight:500;letter-spacing:-.045em;line-height:1;margin-top:16px}

.op-faq{display:grid;grid-template-columns:5fr 7fr;gap:80px;align-items:start}
.op-q{border-top:1px solid var(--line)}
.op-q:last-child{border-bottom:1px solid var(--line)}
.op-q button{width:100%;display:flex;align-items:center;gap:24px;padding:26px 0;background:none;border:0;color:var(--fg);cursor:pointer;text-align:left;font-family:var(--sans)}
.op-q button .i{color:var(--dim);flex-shrink:0;width:28px}
.op-q button .t{font-size:19px;font-weight:500;letter-spacing:-.015em;flex:1}
.op-q button .pm{font-family:var(--mono);color:var(--mut);transition:transform .2s;font-size:18px}
.op-q.open button .pm{transform:rotate(45deg)}
.op-q .a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .3s}
.op-q.open .a{grid-template-rows:1fr}
.op-q .a>div{overflow:hidden}
.op-q .a p{margin:0;padding:0 40px 28px 0;font-size:15.5px;line-height:1.7;color:var(--mut)}

@media (max-width:1080px){
  .op-plans{grid-template-columns:1fr;max-width:620px}
  .op-band{grid-template-columns:repeat(2,1fr)}
  .op-band>div:nth-child(2){border-right:0}
  .op-band>div:nth-child(3){padding-left:0}
  .op-band>div:nth-child(n+3){border-top:1px solid var(--line)}
  .op-faq{grid-template-columns:1fr;gap:48px}
}
@media (max-width:720px){
  .op-head{padding:132px 0 64px}
  .op-plans{margin-top:64px}
  .op-plan{padding:28px 22px 32px}
  .op-price .n{font-size:56px}
  .op-plan p.d{min-height:0}
  .op-band{margin-top:80px}
  .op-band>div,.op-band>div+div{padding:24px 16px 28px 0}
  .op-band>div:nth-child(even){padding-left:16px}
  .op-q button .t{font-size:17px}
  .op-q .a p{padding:0 0 24px 0}
}
`

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  useReveal()

  return (
    <div className="ox">
      <style>{CSS + PCSS}</style>
      <SiteNav active="Pricing" />

      <header className="op-head">
        <div className="ox-grid-bg" />
        <div className="ox-wrap">
          <div className="op-headrow">
            <h1 className="ox-h2 ox-r ox-d1" style={{ fontSize: 'clamp(44px,6.4vw,104px)', lineHeight: .94, maxWidth: '11em' }}>Orbital awareness, <em>at every scale.</em></h1>
            <div className="op-toggle ox-r ox-d2" role="group" aria-label="Billing period">
              <button className={!annual ? 'on' : undefined} onClick={() => setAnnual(false)} aria-pressed={!annual}>Monthly</button>
              <button className={annual ? 'on' : undefined} onClick={() => setAnnual(true)} aria-pressed={annual}>Annual <em>−17%</em></button>
            </div>
          </div>
          <p className="ox-lede ox-r ox-d2" style={{ marginTop: 36, marginBottom: 0 }}>Start free. Upgrade when your fleet needs alerts, an API and guarantees.</p>
        </div>
      </header>

      <section style={{ paddingBottom: 160, borderBottom: '1px solid var(--line)' }}>
        <div className="ox-wrap">
          <div className="op-plans">
            {PLANS.map((p, i) => {
              const amt = annual ? p.price.annual : p.price.monthly
              return (
                <article key={p.name} className={'op-plan ox-r ox-d' + i + (p.popular ? ' pop' : '')}>
                  {p.popular && <div className="hd ox-mono"><span className="rec">Recommended</span></div>}
                  <h3>{p.name}</h3>
                  <div className="op-price">
                    {amt === null ? <span className="n" style={{ fontSize: 52 }}>Custom</span>
                      : amt === 0 ? <span className="n">£0</span>
                      : <><span className="n">£{amt}</span><span className="u">/ month</span></>}
                  </div>
                  <div className="op-billed ox-mono">
                    {amt > 0 ? (annual ? `Billed £${(amt * 12).toLocaleString()} yearly` : 'Billed monthly') : amt === 0 ? 'Free forever' : 'Volume & contract pricing'}
                  </div>
                  <p className="d">{p.desc}</p>
                  <a href={p.href} className={'ox-btn ' + (p.popular ? 'pri' : 'sec')}>{p.cta} <Arrow /></a>
                  <ul className="op-feats">
                    {p.features.map(f => <li key={f}><span>+</span>{f}</li>)}
                    {p.missing.map(f => <li key={f} className="no"><span>—</span>{f}</li>)}
                  </ul>
                </article>
              )
            })}
          </div>

          <div className="op-band">
            {[['Objects catalogued', '27,000+'], ['Screening cycle', '5 s'], ['Default alert threshold', '< 5 km'], ['Enterprise uptime SLA', '99.9%']].map(([l, v], i) => (
              <div key={l} className={'ox-r ox-d' + i}><div className="ox-mono ox-dim">{l}</div><div className="v">{v}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="ox-sec">
        <div className="ox-wrap op-faq">
          <div>
            <h2 className="ox-h2 ox-r ox-d1" style={{ fontSize: 'clamp(34px,4vw,60px)' }}>Before you <em>commit.</em></h2>
            <p className="ox-p ox-r ox-d2" style={{ marginTop: 28 }}>Anything else? <a href="mailto:hello@orbitos.space" style={{ color: 'var(--fg)', borderBottom: '1px solid var(--line2)' }}>hello@orbitos.space</a></p>
          </div>
          <div className="ox-r ox-d2">
            {FAQS.map((f, i) => (
              <div key={i} className={'op-q' + (openFaq === i ? ' open' : '')}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                  <span className="t">{f.q}</span>
                  <span className="pm">+</span>
                </button>
                <div className="a"><div><p>{f.a}</p></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ox-close">
        <div className="ox-grid-bg" style={{ maskImage: 'radial-gradient(ellipse at 80% 60%,#000 0%,transparent 60%)', WebkitMaskImage: 'radial-gradient(ellipse at 80% 60%,#000 0%,transparent 60%)' }} />
        <div className="ox-wrap" style={{ position: 'relative' }}>
          <h2 className="ox-h2 ox-r">Start tracking<br />in <em>sixty seconds.</em></h2>
          <p className="ox-lede ox-r ox-d1" style={{ marginTop: 40 }}>No credit card. No procurement cycle. The free plan stays free.</p>
          <div className="ox-ctas ox-r ox-d2">
            <a href="/app" className="ox-btn pri">Launch platform <Arrow /></a>
            <a href="mailto:hello@orbitos.space?subject=OrbitOS%20briefing" className="ox-btn sec">Talk to us</a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

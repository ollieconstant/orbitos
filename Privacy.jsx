const M = 'system-ui,-apple-system,sans-serif'
const Section = ({ title, children }) => (
  <div style={{ marginBottom:36 }}>
    <h2 style={{ fontSize:18, fontWeight:700, color:'#f1f5f9', margin:'0 0 12px', paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.07)' }}>{title}</h2>
    <div style={{ fontSize:14, color:'rgba(148,163,184,0.7)', lineHeight:1.9 }}>{children}</div>
  </div>
)
export default function Privacy() {
  return (
    <div style={{ background:'#0a1020', minHeight:'100vh', fontFamily:M, color:'#cbd5e1' }}>
      <nav style={{ height:52, background:'#0f172a', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', padding:'0 24px', gap:8 }}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
          <span style={{ fontSize:20, color:'#38bdf8' }}>◎</span>
          <span style={{ color:'#38bdf8', fontWeight:700, fontSize:15 }}>OrbitOS</span>
        </a>
      </nav>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'56px 24px 80px' }}>
        <div style={{ marginBottom:40 }}>
          <h1 style={{ fontSize:32, fontWeight:700, color:'#f1f5f9', margin:'0 0 8px' }}>Privacy Policy</h1>
          <p style={{ fontSize:13, color:'rgba(148,163,184,0.4)' }}>Last updated: September 2025 · OrbitOS Ltd</p>
        </div>
        <Section title="Who we are">
          OrbitOS Ltd is a space traffic management platform registered in England and Wales. We operate the website and services at orbitos-8n5.pages.dev and orbitos.space. Our contact email is hello@orbitos.space.
        </Section>
        <Section title="What data we collect">
          <p style={{ marginBottom:12 }}>We collect only what is necessary to operate the service:</p>
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
            <li><strong style={{ color:'#e2e8f0' }}>Account data:</strong> email address and password hash when you create an account.</li>
            <li><strong style={{ color:'#e2e8f0' }}>Usage data:</strong> API call counts, endpoints used, and response times — used for billing and rate limiting only.</li>
            <li><strong style={{ color:'#e2e8f0' }}>Technical data:</strong> IP address and user agent logged per API request for security purposes. Retained for 30 days.</li>
            <li><strong style={{ color:'#e2e8f0' }}>Payment data:</strong> Handled entirely by Stripe. We never see or store your card number. We receive only a customer ID and subscription status.</li>
            <li><strong style={{ color:'#e2e8f0' }}>Cookies:</strong> See the Cookie section below.</li>
          </ul>
        </Section>
        <Section title="What we do NOT collect">
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
            <li>Your location or device GPS</li>
            <li>Any data from your satellite operations or ground station</li>
            <li>Social media data or third-party profiles</li>
            <li>Any data from children under 18</li>
          </ul>
        </Section>
        <Section title="How we use your data">
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
            <li>To provide the OrbitOS service and your account</li>
            <li>To process payments via Stripe</li>
            <li>To send transactional emails (welcome, billing, alerts) via Resend</li>
            <li>To enforce rate limits on API access</li>
            <li>To investigate security incidents</li>
          </ul>
          <p style={{ marginTop:12 }}>We do not sell your data. We do not use your data for advertising profiling. We do not share your data with any third party except the processors listed below.</p>
        </Section>
        <Section title="Cookies">
          <p style={{ marginBottom:12 }}>We use three categories of cookies:</p>
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:8 }}>
            <li><strong style={{ color:'#e2e8f0' }}>Essential (always on):</strong> Authentication session, cookie consent preference, cached satellite data. These are required for the site to function.</li>
            <li><strong style={{ color:'#e2e8f0' }}>Analytics (optional):</strong> Anonymous usage statistics to understand how the product is used. No personal data is included. You can opt out.</li>
            <li><strong style={{ color:'#e2e8f0' }}>Advertising (optional, free tier only):</strong> Google AdSense cookies to show relevant ads on the free tier. Pro users see no ads and no advertising cookies are set. You can opt out.</li>
          </ul>
          <p style={{ marginTop:12 }}>You can change your cookie preferences at any time by clicking "Cookie settings" in the footer.</p>
        </Section>
        <Section title="Data processors">
          <p style={{ marginBottom:8 }}>We use the following third-party processors, each under a data processing agreement:</p>
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
            <li><strong style={{ color:'#e2e8f0' }}>Supabase</strong> (database + authentication) — EU servers</li>
            <li><strong style={{ color:'#e2e8f0' }}>Cloudflare</strong> (hosting + CDN) — global edge</li>
            <li><strong style={{ color:'#e2e8f0' }}>Stripe</strong> (payments) — UK/EU servers</li>
            <li><strong style={{ color:'#e2e8f0' }}>Resend</strong> (transactional email) — EU servers</li>
            <li><strong style={{ color:'#e2e8f0' }}>Google AdSense</strong> (advertising, free tier only) — global</li>
          </ul>
        </Section>
        <Section title="Your rights (UK GDPR)">
          <p style={{ marginBottom:8 }}>You have the right to:</p>
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
            <li><strong style={{ color:'#e2e8f0' }}>Access</strong> — request a copy of your personal data</li>
            <li><strong style={{ color:'#e2e8f0' }}>Rectification</strong> — correct inaccurate data</li>
            <li><strong style={{ color:'#e2e8f0' }}>Erasure</strong> — request deletion of your account and data</li>
            <li><strong style={{ color:'#e2e8f0' }}>Portability</strong> — receive your data in a machine-readable format</li>
            <li><strong style={{ color:'#e2e8f0' }}>Object</strong> — opt out of analytics or advertising cookies</li>
            <li><strong style={{ color:'#e2e8f0' }}>Complain</strong> — lodge a complaint with the ICO at ico.org.uk</li>
          </ul>
          <p style={{ marginTop:12 }}>To exercise any right, email hello@orbitos.space. We will respond within 30 days.</p>
        </Section>
        <Section title="Data retention">
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
            <li>Account data: retained until you delete your account</li>
            <li>API usage logs: 90 days</li>
            <li>IP address logs: 30 days</li>
            <li>Payment records: 7 years (legal requirement)</li>
            <li>TLE satellite data: indefinitely (public domain data)</li>
          </ul>
        </Section>
        <Section title="Security">
          All data is encrypted in transit (TLS 1.3) and at rest. Passwords are never stored — we use Supabase Auth which stores bcrypt hashes. API keys are stored as SHA-256 hashes. We never log or store payment card numbers.
        </Section>
        <Section title="Contact">
          <p>Email: hello@orbitos.space</p>
          <p style={{ marginTop:6 }}>OrbitOS Ltd, England and Wales</p>
          <p style={{ marginTop:6 }}>ICO registration number: (pending)</p>
        </Section>
      </div>
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'24px', textAlign:'center' }}>
        <a href="/" style={{ fontSize:12, color:'rgba(148,163,184,0.3)', textDecoration:'none' }}>← Back to OrbitOS</a>
      </footer>
    </div>
  )
}

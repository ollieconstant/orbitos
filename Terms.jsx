const M = 'system-ui,-apple-system,sans-serif'
const Section = ({ title, children }) => (
  <div style={{ marginBottom:36 }}>
    <h2 style={{ fontSize:18, fontWeight:700, color:'#f1f5f9', margin:'0 0 12px', paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.07)' }}>{title}</h2>
    <div style={{ fontSize:14, color:'rgba(148,163,184,0.7)', lineHeight:1.9 }}>{children}</div>
  </div>
)
export default function Terms() {
  return (
    <div style={{ background:'#0a1020', minHeight:'100vh', fontFamily:M, color:'#cbd5e1' }}>
      <nav style={{ height:52, background:'#0f172a', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', padding:'0 24px' }}>
        <a href="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
          <span style={{ fontSize:20, color:'#38bdf8' }}>◎</span>
          <span style={{ color:'#38bdf8', fontWeight:700, fontSize:15 }}>OrbitOS</span>
        </a>
      </nav>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'56px 24px 80px' }}>
        <div style={{ marginBottom:40 }}>
          <h1 style={{ fontSize:32, fontWeight:700, color:'#f1f5f9', margin:'0 0 8px' }}>Terms of Service</h1>
          <p style={{ fontSize:13, color:'rgba(148,163,184,0.4)' }}>Last updated: September 2025 · OrbitOS Ltd</p>
        </div>
        <Section title="Acceptance">
          By using OrbitOS you agree to these terms. If you are using OrbitOS on behalf of an organisation, you are agreeing on their behalf. If you do not agree, do not use the service.
        </Section>
        <Section title="The service">
          OrbitOS provides real-time satellite tracking, conjunction detection, and orbital data via a web application and REST API. We use publicly available Two-Line Element (TLE) data from Space-Track.org and Celestrak. Satellite positions are computed using the SGP4 algorithm.
          <p style={{ marginTop:12, padding:'12px 16px', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:8, color:'#fbbf24', fontSize:13 }}>
            <strong>Important:</strong> OrbitOS is a decision-support tool. It should not be the sole basis for spacecraft manoeuvre decisions. Always consult additional data sources and qualified operators for mission-critical decisions.
          </p>
        </Section>
        <Section title="Accounts">
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
            <li>You must provide a valid email address to create an account.</li>
            <li>You are responsible for keeping your password and API keys secure.</li>
            <li>You must be 18 or over to create a paid account. Under-18s may use the free tier with parental permission.</li>
            <li>You may not share your account or API keys with others (each user needs their own account).</li>
          </ul>
        </Section>
        <Section title="Acceptable use">
          <p style={{ marginBottom:10 }}>You may use OrbitOS for any lawful purpose. You may not:</p>
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
            <li>Attempt to circumvent rate limits or access controls</li>
            <li>Reverse engineer or scrape the service in bulk beyond your plan limits</li>
            <li>Resell raw TLE data (you may sell services built on top of OrbitOS)</li>
            <li>Use the service for any purpose that violates UK or international law</li>
            <li>Use the service to track satellites for purposes that violate ITAR or EAR export regulations</li>
            <li>Attempt to access other users' data</li>
          </ul>
        </Section>
        <Section title="Plans and payment">
          <ul style={{ paddingLeft:20, display:'flex', flexDirection:'column', gap:6 }}>
            <li><strong style={{ color:'#e2e8f0' }}>Free plan:</strong> Provided as-is. We may change or discontinue it with 30 days notice.</li>
            <li><strong style={{ color:'#e2e8f0' }}>Pro plan:</strong> Billed monthly or annually via Stripe. Your 14-day free trial begins immediately. You will not be charged until the trial ends.</li>
            <li><strong style={{ color:'#e2e8f0' }}>Cancellation:</strong> Cancel any time from your dashboard. Access continues to the end of the billing period. No refunds for partial periods.</li>
            <li><strong style={{ color:'#e2e8f0' }}>Price changes:</strong> We will give 30 days notice before changing Pro pricing.</li>
          </ul>
        </Section>
        <Section title="Data and intellectual property">
          TLE satellite data is sourced from public domain US government sources (Space-Track.org, Celestrak) and is not owned by OrbitOS. Our conjunction analysis, predictions, and software are proprietary. You may not copy or redistribute our code or derived products without permission.
        </Section>
        <Section title="Liability">
          OrbitOS is provided "as is". We do not guarantee uptime, accuracy, or fitness for any particular purpose. We are not liable for any loss or damage arising from use of the service, including spacecraft manoeuvres made based on OrbitOS data. Our maximum liability in any circumstance is limited to the amount you paid us in the previous 12 months.
        </Section>
        <Section title="Changes to these terms">
          We may update these terms. We will email you at least 14 days before material changes take effect. Continued use after that date means you accept the new terms.
        </Section>
        <Section title="Governing law">
          These terms are governed by the laws of England and Wales. Any disputes are subject to the exclusive jurisdiction of the English courts.
        </Section>
        <Section title="Contact">
          <p>Email: hello@orbitos.space</p>
          <p style={{ marginTop:6 }}>OrbitOS Ltd, England and Wales</p>
        </Section>
      </div>
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:'24px', textAlign:'center' }}>
        <a href="/" style={{ fontSize:12, color:'rgba(148,163,184,0.3)', textDecoration:'none' }}>← Back to OrbitOS</a>
      </footer>
    </div>
  )
}

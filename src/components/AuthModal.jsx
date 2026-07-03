import { useState } from 'react'
import { signIn, signUp, signInWithOAuth, signOut, supabase } from '../services/supabaseClient'

const M = 'system-ui,-apple-system,sans-serif'

export default function AuthModal({ user, onClose }) {
  const [tab,     setTab]     = useState('signin') // signin | signup
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [msg,     setMsg]     = useState(null)
  const [loading, setLoading] = useState(false)

  const notConfigured = !supabase

  const field = {
    width:'100%', background:'rgba(255,255,255,0.05)',
    border:'1px solid rgba(255,255,255,0.1)', borderRadius:8,
    padding:'10px 14px', fontFamily:M, fontSize:13,
    color:'#f1f5f9', outline:'none', marginBottom:10,
  }
  const primaryBtn = {
    width:'100%', padding:10, background:'#38bdf8', color:'#0f172a',
    border:'none', borderRadius:8, fontFamily:M, fontSize:14,
    fontWeight:700, cursor:'pointer', marginBottom:8,
  }
  const secondaryBtn = {
    width:'100%', padding:10, background:'transparent',
    border:'1px solid rgba(255,255,255,0.1)', borderRadius:8,
    fontFamily:M, fontSize:13, color:'rgba(148,163,184,0.7)',
    cursor:'pointer', marginBottom:6,
  }

  async function handleSignIn() {
    setLoading(true); setMsg(null)
    const { error } = await signIn(email, pass)
    if (error) setMsg({ text:error.message, ok:false })
    else { setMsg({ text:'Signed in!', ok:true }); setTimeout(onClose, 600) }
    setLoading(false)
  }

  async function handleSignUp() {
    setLoading(true); setMsg(null)
    const { error } = await signUp(email, pass)
    if (error) setMsg({ text:error.message, ok:false })
    else setMsg({ text:'Check your email to confirm your account.', ok:true })
    setLoading(false)
  }

  async function handleOAuth(provider) {
    const { error } = await signInWithOAuth(provider)
    if (error) setMsg({ text:error.message, ok:false })
  }

  async function handleSignOut() {
    await signOut(); onClose()
  }

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(10,16,32,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, fontFamily:M }}
      onClick={onClose}
    >
      <div
        style={{ width:360, background:'#0f172a', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, overflow:'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18, color:'#38bdf8' }}>◎</span>
            <span style={{ color:'#38bdf8', fontWeight:700, fontSize:15 }}>OrbitOS</span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(148,163,184,0.4)', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>

        <div style={{ padding:24 }}>
          {notConfigured ? (
            <div style={{ padding:16, background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:8, fontSize:13, color:'#fbbf24', lineHeight:1.6 }}>
              <strong>Supabase not connected.</strong><br/>
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your Vercel environment variables to enable auth.
            </div>
          ) : user ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(56,189,248,0.15)', border:'1px solid rgba(56,189,248,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#38bdf8' }}>
                  {user.email[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:14, color:'#f1f5f9', fontWeight:500 }}>{user.email.split('@')[0]}</div>
                  <div style={{ fontSize:12, color:'rgba(148,163,184,0.45)' }}>{user.email}</div>
                </div>
              </div>
              <div style={{ padding:'8px 12px', background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:8, fontSize:12, color:'#34d399', marginBottom:16 }}>
                ● Signed in · Free plan
              </div>
              <button style={primaryBtn} onClick={() => window.location.href = '/pricing'}>
                Upgrade to Pro →
              </button>
              <button style={secondaryBtn} onClick={handleSignOut}>Sign out</button>
            </>
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display:'flex', gap:0, marginBottom:20, background:'rgba(255,255,255,0.04)', borderRadius:8, padding:3 }}>
                {[['signin','Sign in'],['signup','Create account']].map(([t,l]) => (
                  <button key={t} onClick={() => { setTab(t); setMsg(null) }}
                    style={{ flex:1, padding:'7px', border:'none', borderRadius:6, background:tab===t?'#0f172a':'transparent', color:tab===t?'#f1f5f9':'rgba(148,163,184,0.5)', fontFamily:M, fontSize:13, fontWeight:tab===t?500:400, cursor:'pointer', transition:'all .15s' }}>
                    {l}
                  </button>
                ))}
              </div>

              <div style={{ fontSize:12, color:'rgba(148,163,184,0.4)', marginBottom:5 }}>Email</div>
              <input style={field} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(tab==='signin'?handleSignIn():handleSignUp())} />
              <div style={{ fontSize:12, color:'rgba(148,163,184,0.4)', marginBottom:5 }}>Password</div>
              <input style={field} type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(tab==='signin'?handleSignIn():handleSignUp())} />

              {msg && (
                <div style={{ padding:'8px 12px', border:`1px solid ${msg.ok?'rgba(52,211,153,0.25)':'rgba(239,68,68,0.25)'}`, background:msg.ok?'rgba(52,211,153,0.08)':'rgba(239,68,68,0.08)', borderRadius:8, fontSize:12, color:msg.ok?'#34d399':'#f87171', marginBottom:10, lineHeight:1.5 }}>
                  {msg.text}
                </div>
              )}

              <button style={primaryBtn} onClick={tab==='signin'?handleSignIn:handleSignUp} disabled={loading}>
                {loading ? '…' : tab==='signin' ? 'Sign in' : 'Create account'}
              </button>

              <div style={{ display:'flex', alignItems:'center', gap:8, margin:'8px 0' }}>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }} />
                <span style={{ fontSize:12, color:'rgba(148,163,184,0.35)' }}>or</span>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.07)' }} />
              </div>

              <button style={secondaryBtn} onClick={() => handleOAuth('google')}>
                Continue with Google
              </button>
              <button style={{ ...secondaryBtn, marginBottom:0 }} onClick={() => handleOAuth('github')}>
                Continue with GitHub
              </button>

              {tab === 'signup' && (
                <p style={{ fontSize:11, color:'rgba(148,163,184,0.3)', marginTop:12, lineHeight:1.6, textAlign:'center' }}>
                  By creating an account you agree to our{' '}
                  <a href="/terms" style={{ color:'rgba(56,189,248,0.5)' }}>Terms of Service</a>{' '}and{' '}
                  <a href="/privacy" style={{ color:'rgba(56,189,248,0.5)' }}>Privacy Policy</a>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

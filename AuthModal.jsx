import { useState } from 'react'
import { signIn, signUp, signInWithOAuth, signOut, supabase } from './supabaseClient.js'

import { C, SANS, MONO } from './theme.js'
import { Logo } from './site.jsx'

const label = { fontFamily:MONO, fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:C.dim, marginBottom:6 }
const field = { width:'100%', height:42, background:C.bg2, border:`1px solid ${C.line2}`, borderRadius:0, padding:'0 14px', fontFamily:SANS, fontSize:14, color:C.fg, outline:'none', marginBottom:14 }
const btnBase = { width:'100%', height:44, borderRadius:0, fontFamily:MONO, fontSize:11, letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer', marginBottom:8 }
const primaryBtn = { ...btnBase, background:C.fg, color:C.bg, border:`1px solid ${C.fg}` }
const secondaryBtn = { ...btnBase, background:'transparent', color:C.fg, border:`1px solid ${C.line2}` }

export default function AuthModal({ user, onClose }) {
  const [tab,setTab]=useState('signin'), [email,setEmail]=useState(''), [pass,setPass]=useState(''), [msg,setMsg]=useState(null), [loading,setLoading]=useState(false)
  const notConfigured=!supabase

  async function handleSignIn() { setLoading(true);setMsg(null); const{error}=await signIn(email,pass); if(error)setMsg({text:error.message,ok:false}); else{setMsg({text:'Signed in!',ok:true});setTimeout(onClose,600)}; setLoading(false) }
  async function handleSignUp() { setLoading(true);setMsg(null); const{error}=await signUp(email,pass); if(error)setMsg({text:error.message,ok:false}); else setMsg({text:'Check your email to confirm.',ok:true}); setLoading(false) }
  async function handleOAuth(p) { const{error}=await signInWithOAuth(p); if(error)setMsg({text:error.message,ok:false}) }
  async function handleSignOut() { await signOut(); onClose() }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, fontFamily:SANS, padding:16 }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:380, background:C.bg, border:`1px solid ${C.line2}`, color:C.fg }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.line}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Logo size={18} />
            <span style={{ fontWeight:600, letterSpacing:'.32em', fontSize:12 }}>ORBITOS</span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.mut, cursor:'pointer', fontSize:20, lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:'24px 20px 20px' }}>
          {notConfigured ? (
            <div style={{ padding:16, border:`1px solid rgba(255,90,31,.4)`, background:'rgba(255,90,31,.05)', fontSize:13, color:C.mut, lineHeight:1.6 }}>
              <strong style={{ color:C.sig, fontFamily:MONO, fontSize:11, letterSpacing:'.12em' }}>AUTH NOT CONNECTED</strong><br/>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Cloudflare environment variables to enable auth.
            </div>
          ) : user ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <div style={{ width:40, height:40, border:`1px solid ${C.line2}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:MONO, fontSize:14, color:C.fg }}>{user.email[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize:15, color:C.fg, fontWeight:500 }}>{user.email.split('@')[0]}</div>
                  <div style={{ fontFamily:MONO, fontSize:11, color:C.dim }}>{user.email}</div>
                </div>
              </div>
              <button style={primaryBtn} onClick={()=>window.location.href='/pricing'}>Upgrade to Pro →</button>
              <button style={secondaryBtn} onClick={handleSignOut}>Sign out</button>
            </>
          ) : (
            <>
              <div style={{ display:'flex', marginBottom:22, border:`1px solid ${C.line2}` }}>
                {[['signin','Sign in'],['signup','Create account']].map(([t,l])=>(
                  <button key={t} onClick={()=>{setTab(t);setMsg(null)}} style={{ flex:1, height:36, border:'none', borderRadius:0, background:tab===t?C.fg:'transparent', color:tab===t?C.bg:C.mut, fontFamily:MONO, fontSize:10.5, letterSpacing:'.14em', textTransform:'uppercase', cursor:'pointer' }}>{l}</button>
                ))}
              </div>
              <div style={label}>Email</div>
              <input style={field} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(tab==='signin'?handleSignIn():handleSignUp())} />
              <div style={label}>Password</div>
              <input style={field} type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(tab==='signin'?handleSignIn():handleSignUp())} />
              {msg&&<div style={{ padding:'10px 12px', border:`1px solid ${msg.ok?'rgba(125,211,252,.4)':'rgba(255,90,31,.45)'}`, fontSize:12.5, color:msg.ok?C.live:C.sig, marginBottom:12 }}>{msg.text}</div>}
              <button style={primaryBtn} onClick={tab==='signin'?handleSignIn:handleSignUp} disabled={loading}>{loading?'...':tab==='signin'?'Sign in':'Create account'}</button>
              <div style={{ display:'flex', alignItems:'center', gap:10, margin:'10px 0 14px' }}>
                <div style={{ flex:1, height:1, background:C.line }} />
                <span style={{ fontFamily:MONO, fontSize:10, letterSpacing:'.14em', color:C.dim }}>OR</span>
                <div style={{ flex:1, height:1, background:C.line }} />
              </div>
              <button style={secondaryBtn} onClick={()=>handleOAuth('google')}>Continue with Google</button>
              <button style={{...secondaryBtn,marginBottom:0}} onClick={()=>handleOAuth('github')}>Continue with GitHub</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

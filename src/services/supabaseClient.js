// src/services/supabaseClient.js
// Supabase client — fails silently if env vars not configured

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is actually configured
const isConfigured = SUPABASE_URL &&
  SUPABASE_URL !== 'https://placeholder.supabase.co' &&
  !SUPABASE_URL.includes('placeholder') &&
  SUPABASE_ANON &&
  SUPABASE_ANON !== 'placeholder_anon_key' &&
  !SUPABASE_ANON.includes('placeholder')

// Only create client if properly configured
export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null

if (!isConfigured) {
  console.info('[Supabase] Not configured — auth and watchlist features disabled. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable.')
}

// ── AUTH ──────────────────────────────────────────────────────
export const signUp  = (e, p) => supabase ? supabase.auth.signUp({ email:e, password:p }) : Promise.resolve({ error:{ message:'Supabase not configured' } })
export const signIn  = (e, p) => supabase ? supabase.auth.signInWithPassword({ email:e, password:p }) : Promise.resolve({ error:{ message:'Supabase not configured' } })
export const signOut = ()     => supabase ? supabase.auth.signOut() : Promise.resolve({})
export const getUser = ()     => supabase ? supabase.auth.getUser().then(r => r.data.user) : Promise.resolve(null)

export const onAuthStateChange = (cb) => {
  if (!supabase) { cb(null); return { data: { subscription: { unsubscribe: () => {} } } } }
  return supabase.auth.onAuthStateChange((_e, s) => cb(s?.user ?? null))
}

export const signInWithOAuth = (provider) =>
  supabase
    ? supabase.auth.signInWithOAuth({ provider, options:{ redirectTo:window.location.origin } })
    : Promise.resolve({ error:{ message:'Supabase not configured' } })

// ── WATCHLIST ─────────────────────────────────────────────────
export const getWatchlist = (userId) => {
  if (!supabase || !userId) return Promise.resolve([])
  return supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending:false })
    .then(r => r.data ?? [])
    .catch(() => [])
}

export const addToWatchlist = (userId, sat) => {
  if (!supabase || !userId) return Promise.resolve(null)
  return supabase
    .from('watchlist')
    .upsert({
      user_id:        userId,
      satellite_id:   sat.id,
      satellite_name: sat.name,
      category:       sat.cat,
      altitude_km:    sat.position?.alt ?? sat.alt ?? 0,
      threshold_km:   5,
      alert_email:    true,
      alert_push:     true,
    }, { onConflict:'user_id,satellite_id' })
    .catch(() => null)
}

export const removeFromWatchlist = (userId, satelliteId) => {
  if (!supabase || !userId) return Promise.resolve(null)
  return supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('satellite_id', satelliteId)
    .catch(() => null)
}

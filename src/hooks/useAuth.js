// src/hooks/useAuth.js
// Handles auth gracefully when Supabase is not configured

import { useState, useEffect } from 'react'
import { getUser, onAuthStateChange, getWatchlist, addToWatchlist, removeFromWatchlist, supabase } from '../services/supabaseClient'

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUser()
      .then(u => { setUser(u); setLoading(false) })
      .catch(() => setLoading(false))

    const { data: { subscription } } = onAuthStateChange(setUser)
    return () => { try { subscription?.unsubscribe?.() } catch {} }
  }, [])

  return { user, loading }
}

export function useWatchlist(userId) {
  const [watchlist, setWatchlist] = useState([])
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    if (!userId || !supabase) { setWatchlist([]); return }

    setLoading(true)
    getWatchlist(userId)
      .then(data => { setWatchlist(data ?? []); setLoading(false) })
      .catch(() => setLoading(false))

    // Real-time sync only if Supabase is configured
    if (!supabase) return
    try {
      const channel = supabase
        .channel(`watchlist:${userId}`)
        .on('postgres_changes', {
          event:'*', schema:'public', table:'watchlist',
          filter:`user_id=eq.${userId}`,
        }, () => getWatchlist(userId).then(data => setWatchlist(data ?? [])))
        .subscribe()
      return () => { try { supabase.removeChannel(channel) } catch {} }
    } catch {}
  }, [userId])

  const add    = (sat) => addToWatchlist(userId, sat).then(() => getWatchlist(userId).then(setWatchlist)).catch(() => {})
  const remove = (id)  => removeFromWatchlist(userId, id).then(() => getWatchlist(userId).then(setWatchlist)).catch(() => {})

  return { watchlist, loading, add, remove }
}

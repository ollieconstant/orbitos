import { useState, useEffect } from 'react'
import { getUser, onAuthStateChange } from '../services/supabaseClient.js'

export function useAuth() {
  const [user,setUser]=useState(null), [loading,setLoading]=useState(true)
  useEffect(() => {
    getUser().then(u=>{setUser(u);setLoading(false)}).catch(()=>setLoading(false))
    const { data:{ subscription } } = onAuthStateChange(setUser)
    return () => { try { subscription?.unsubscribe?.() } catch {} }
  }, [])
  return { user, loading }
}

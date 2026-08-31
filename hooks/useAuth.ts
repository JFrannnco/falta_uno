import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 👇 Listener principal (este es el importante)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false) // 🔥 esto corta el loading SIEMPRE
      }
    )

    // 👇 fallback (por si no dispara el listener rápido)
    setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}
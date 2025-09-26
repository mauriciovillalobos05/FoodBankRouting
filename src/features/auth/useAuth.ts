import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase'

export function useAuth() {
  const [user, setUser] = useState<null | any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setUser(data.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      mounted = false
      sub?.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

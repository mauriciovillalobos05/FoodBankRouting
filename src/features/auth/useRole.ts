import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase'

export function useRole() {
  const [role, setRole] = useState<'volunteer'|'staff'|null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return active && setRole(null)
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      active && setRole((data?.role as any) ?? 'volunteer')
    }
    load()
    return () => { active = false }
  }, [])

  return { role }
}

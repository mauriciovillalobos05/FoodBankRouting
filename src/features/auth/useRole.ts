import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from './useAuth';

export function useRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<'volunteer' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (authLoading) return;           // wait for auth to resolve
      setLoading(true);

      if (!user) {
        if (active) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (active) {
        if (error) {
          // fallback if row doesn't exist yet; pick what makes sense for you
          setRole('volunteer');
        } else {
          setRole((data?.role as 'volunteer' | 'staff' | undefined) ?? 'volunteer');
        }
        setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [user, authLoading]);

  return { role, loading };
}
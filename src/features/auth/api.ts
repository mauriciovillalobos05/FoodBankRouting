import { supabase } from '@/services/supabase';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUp(email: string, password: string, profile: {name: string}) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name: profile.name, role: 'volunteer' } }
  });
  if (error) throw error;
  return data.user;
}

export function onAuthStateChange(callback: (signedIn: boolean)=>void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(!!session);
  });
}

export async function signOut() {
  await supabase.auth.signOut();
}


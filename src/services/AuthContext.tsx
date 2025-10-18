import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, safeLogError } from './supabase';

type AuthContextType = {
  user: any | null;
  role: 'admin' | 'staff' | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<'admin' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    try {
      console.log('🔄 AuthContext: loadSession iniciando...');
      setLoading(true);

      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (data?.session?.user) {
        console.log('✅ AuthContext: usuario detectado', data.session.user.email);
        setUser(data.session.user);

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.session.user.id)
          .single();

        if (userError) {
          safeLogError('Error obteniendo rol', userError);
          console.log('⚠️ AuthContext: fallback role=staff');
          setRole('staff');
        } else {
          const userRole = userData?.role === 'admin' ? 'admin' : 'staff';
          console.log('✅ AuthContext: rol obtenido:', userRole);
          setRole(userRole);
        }
      } else {
        console.log('❌ AuthContext: no hay usuario');
        setUser(null);
        setRole(null);
      }
    } catch (e) {
      console.warn('❌ AuthContext: error cargando sesión', e);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
      console.log('🔄 AuthContext: loadSession completado. Role:', role);
    }
  };

  useEffect(() => {
    console.log('🎬 AuthContext: montado, cargando sesión inicial...');
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔔 AuthContext: onAuthStateChange event:', _event);
      
      if (session?.user) {
        console.log('✅ AuthContext: usuario logueado:', session.user.email);
        setUser(session.user);
        
        // Cargar el rol cuando hay un cambio de estado
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            safeLogError('Error obteniendo rol en onAuthStateChange', userError);
            setRole('staff');
          } else {
            const userRole = userData?.role === 'admin' ? 'admin' : 'staff';
            console.log('✅ AuthContext: rol actualizado en onAuthStateChange:', userRole);
            setRole(userRole);
          }
        } catch (e) {
          console.warn('Error cargando rol:', e);
          setRole('staff');
        }
      } else {
        console.log('❌ AuthContext: usuario deslogueado');
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      console.log('🧹 AuthContext: desmontando listener');
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 AuthContext: login iniciando para', email);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (error) throw error;
      if (!data.session?.user) throw new Error('No se pudo iniciar sesión');

      console.log('✅ AuthContext: login exitoso', data.session.user.email);
      setUser(data.session.user);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.session.user.id)
        .single();

      if (userError) {
        safeLogError('Error obteniendo rol', userError);
        console.log('⚠️ AuthContext: fallback role=staff');
        setRole('staff');
      } else {
        const userRole = userData?.role === 'admin' ? 'admin' : 'staff';
        console.log('✅ AuthContext: rol asignado en login:', userRole);
        setRole(userRole);
      }
    } catch (error) {
      console.error('❌ AuthContext: error en login:', error);
      throw error;
    } finally {
      setLoading(false);
      console.log('🔄 AuthContext: login completado. Role:', role);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 AuthContext: logout iniciando...');
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
      console.log('✅ AuthContext: usuario y rol reseteados');
    } catch (error) {
      console.error('❌ AuthContext: error en logout:', error);
    } finally {
      setLoading(false);
    }
  };

  // Log cuando cambia el rol
  useEffect(() => {
    console.log('🎯 AuthContext: rol actualizado a:', role);
  }, [role]);

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
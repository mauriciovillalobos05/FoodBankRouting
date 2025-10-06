// @/screens/volunteer/tabs/Profile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/services/supabase'; 

type DBUser = {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string | null;
  role: 'staff' | 'volunteer';
  location: string | null;
  latitude: number | null;
  longitude: number | null;
};

type AuthUserLite = {
  id: string;
  email?: string;
};

export default function Profile() {
  const nav = useNavigation<any>();
  const [authUser, setAuthUser] = useState<AuthUserLite | null>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        if (!userRes.user) {
          setError('You must be signed in to view your profile.');
          setLoading(false);
          return;
        }

        const authLite: AuthUserLite = {
          id: userRes.user.id,
          email: userRes.user.email ?? undefined,
        };
        if (!alive) return;
        setAuthUser(authLite);

        const { data, error: dbErr } = await supabase
          .from('users')
          .select(
            'id, full_name, phone, created_at, role, location, latitude, longitude'
          )
          .eq('id', userRes.user.id)
          .maybeSingle();

        if (dbErr) throw dbErr;
        if (!alive) return;

        setDbUser((data ?? null) as DBUser | null);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? 'Failed to load profile.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const initials = useMemo(() => {
    const name = dbUser?.full_name ?? authUser?.email ?? '';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(p => (p?.[0] ?? '').toUpperCase())
      .join('');
  }, [dbUser, authUser]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}>
          <Text style={[styles.title, { color: '#b91c1c' }]}>Error</Text>
          <Text style={{ color: '#7f1d1d', marginTop: 4 }}>{error}</Text>
          <TouchableOpacity onPress={() => nav.replace('Profile')} style={[styles.button, { marginTop: 12 }]}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Sin fila en `users` (pero sí hay usuario auth)
  if (!dbUser) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={{ opacity: 0.7, marginTop: 6 }}>
            We couldn’t find your profile record. Please complete your profile.
          </Text>
          <TouchableOpacity
            onPress={() => nav.navigate('CompleteProfile' /* cámbialo si tu screen se llama distinto */)}
            style={[styles.button, { marginTop: 16 }]}
          >
            <Text style={styles.buttonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>{initials || 'U'}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 22, fontWeight: '700' }}>
            {dbUser.full_name || authUser?.email || 'My Profile'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <View style={styles.pill}>
              <Text style={{ fontSize: 12 }}>Role: {dbUser.role}</Text>
            </View>
            {authUser?.email ? (
              <Text style={{ fontSize: 14, opacity: 0.7 }}>{authUser.email}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <InfoCard label="Full name" value={dbUser.full_name ?? '—'} />
        <InfoCard label="Phone" value={dbUser.phone ?? '—'} />
        <InfoCard label="Location" value={dbUser.location ?? '—'} />
        <InfoCard
          label="Coordinates"
          value={
            dbUser.latitude != null && dbUser.longitude != null
              ? `${dbUser.latitude.toFixed(6)}, ${dbUser.longitude.toFixed(6)}`
              : '—'
          }
        />
        <InfoCard
          label="Member since"
          value={dbUser.created_at ? new Date(dbUser.created_at).toLocaleString() : '—'}
        />
        <InfoCard label="User ID" value={dbUser.id} mono />
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
        <TouchableOpacity onPress={() => nav.replace('Profile')} style={styles.buttonSecondary}>
          <Text>Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => nav.navigate('EditProfile' /* cambia al nombre real */)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoCard({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && { fontFamily: 'monospace' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, padding: 16, backgroundColor: 'white' },
  title: { fontSize: 18, fontWeight: '600' },
  button: { backgroundColor: '#000', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
  buttonSecondary: { borderWidth: 1, borderColor: '#e5e7eb', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: 'white' },
  buttonText: { color: 'white', fontWeight: '600' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 999, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  pill: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'white' },
  grid: { gap: 12, marginTop: 8 },
  infoCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, backgroundColor: 'white' },
  infoLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: '#6b7280' },
  infoValue: { marginTop: 4, fontSize: 14 },
});
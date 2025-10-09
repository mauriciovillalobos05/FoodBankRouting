import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, safeLogError } from '@/services/supabase';
import { cacheUserProfile, getCachedUserProfile } from '@/services/userCache';

interface Route {
  id: string;
  // Agrega otros campos de la tabla routes que necesites
  name?: string;
  date?: string;
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userRoutes, setUserRoutes] = useState<Route[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      const cached = await getCachedUserProfile();
      if (cached) {
        setUserName(cached.full_name || 'Usuario');
      }

      // Obtener el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        safeLogError('Error fetching user', userError);
        return;
      }

      // Obtener datos del perfil desde la tabla users
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserName(profile.full_name || 'Usuario');
        
        // Cache encrypted PII
        await cacheUserProfile({
          id: profile.id,
          full_name: profile.full_name,
          email: user.email || '',
        });
      }

      // Obtener rutas asignadas al usuario
      // Join: route_participants -> routes
      const { data: routeParticipants, error: routesError } = await supabase
        .from('route_participants')
        .select(`
          id,
          role,
          assigned_at,
          routes (
            id,
            name,
            description,
            route_date,
            start_time,
            end_time
          )
        `)
        .eq('user_id', user.id);

      if (routesError) {
        safeLogError('Error fetching routes', routesError);
      } else if (routeParticipants) {
        // Extraer las rutas del resultado y filtrar nulos
        const routes = routeParticipants
          .map((rp: any) => rp.routes)
          .filter(Boolean);
        setUserRoutes(routes);
      }

    } catch (error) {
      safeLogError('Error in fetchUserData', error);
    } finally {
      setLoading(false);
    }
  };

  const renderServicesCard = () => {
    if (loading) {
      return (
        <View style={styles.servicesCard}>
          <ActivityIndicator size="large" color="#CE0E2D" />
        </View>
      );
    }

    if (userRoutes.length === 0) {
      return (
        <View style={styles.servicesCard}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📋</Text>
          </View>
          <Text style={styles.emptyText}>No tienes rutas asignadas</Text>
        </View>
      );
    }

    return (
      <View style={styles.routesContainer}>
        {userRoutes.map((route) => (
          <TouchableOpacity 
            key={route.id} 
            style={styles.routeCard}
            onPress={() => {
              // Navegar a los detalles de la ruta si lo necesitas
            }}
          >
            <View style={styles.routeIconContainer}>
              <Text style={styles.routeIcon}>🚐</Text>
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeName}>
                {route.name || 'Ruta sin nombre'}
              </Text>
              <Text style={styles.routeId}>ID: {route.id.slice(0, 8)}...</Text>
              {route.date && (
                <Text style={styles.routeDate}>
                  {new Date(route.date).toLocaleDateString('es-MX')}
                </Text>
              )}
            </View>
            <Text style={styles.routeArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header con avatar y configuraciones */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <View style={styles.avatarIcon}>
                </View>
              </View>
              {loading ? (
                <ActivityIndicator size="small" color="#CE0E2D" style={styles.nameLoader} />
              ) : (
                <Text style={styles.userName}>{userName}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Image
              source={require('../../../assets/conf_icon.png')}
              style={styles.confIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Sección Mis servicios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis servicios</Text>
          {renderServicesCard()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 30,
    paddingBottom: 30,
  },
  avatarContainer: {
    flex: 1,
  },
  avatarWrapper: {
    alignItems: 'flex-start',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIconText: {
    fontSize: 20,
    opacity: 0.6,
  },
  userName: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  nameLoader: {
    marginTop: 12,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  settingsIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'left',
  },
  servicesCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    minHeight: 120,
  },
  emptyIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyIconText: {
    fontSize: 24,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  routesContainer: {
    gap: 12,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeIcon: {
    fontSize: 24,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  routeId: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
  routeDate: {
    fontSize: 12,
    color: '#00953B',
    marginTop: 2,
  },
  routeArrow: {
    fontSize: 24,
    color: '#CCCCCC',
    marginLeft: 8,
  },
  confIcon: {
    width: 24,
    height: 24,
  },
});

export default Profile;
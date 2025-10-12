import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, safeLogError } from '@/services/supabase';
import { cacheActivityData, getCachedActivityData } from '@/services/routesCache';

// Import Route type from the shared location
import type { Route } from '@/services/routesCache';

const Activity = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    try {
      // Try to load from encrypted cache first
      const cached = await getCachedActivityData();
      if (cached) {
        const allRoutes = [...cached.currentRoutes, ...cached.recentRoutes];
        setRoutes(allRoutes);
        setLoading(false);
        // Still fetch fresh data in background
        fetchRoutes(false);
        return;
      }

      // No cache, fetch from database
      await fetchRoutes(true);
    } catch (err) {
      safeLogError('Error loading activity data', err);
      setLoading(false);
    }
  };

  const fetchRoutes = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        safeLogError('Error fetching user', userError);
        setError('No se pudo obtener el usuario');
        setLoading(false);
        return;
      }

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
        setError(routesError.message || 'Error al obtener rutas');
        setRoutes([]);
        setLoading(false);
        return;
      }

      interface RouteParticipant {
        id: string;
        role?: string;
        assigned_at?: string;
        routes?: Route | Route[] | null;
      }

      // Handle both array and single object cases for 'routes'
      const flattened: Route[] = ((routeParticipants as RouteParticipant[]) || [])
        .flatMap((rp: RouteParticipant) => {
          if (Array.isArray(rp.routes)) {
            return rp.routes.filter((r): r is Route => r != null);
          }
          return rp.routes ? [rp.routes] : [];
        });

      setRoutes(flattened);

      // Separate current and recent for caching
      const rutasActuales = flattened.filter(r => r.end_time === null || r.end_time === undefined);
      const rutasCompletadas = flattened.filter(r => r.end_time !== null && r.end_time !== undefined);
      
      const rutasRecientes = rutasCompletadas
        .slice()
        .sort((a, b) => {
          const aDate = a.end_time ? new Date(a.end_time) : new Date(a.route_date || 0);
          const bDate = b.end_time ? new Date(b.end_time) : new Date(b.route_date || 0);
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 3);

      // Cache the encrypted data
      await cacheActivityData({
        currentRoutes: rutasActuales,
        recentRoutes: rutasRecientes,
        timestamp: Date.now(),
      });

    } catch (err: any) {
      safeLogError('Error in fetchRoutes', err);
      setError(err.message || 'Error inesperado');
      setRoutes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutes(false);
  };

  // Filtrado: rutas actuales (sin end_time) y rutas recientes (con end_time)
  const rutasActuales = routes.filter(r => r.end_time === null || r.end_time === undefined);
  const rutasCompletadas = routes.filter(r => r.end_time !== null && r.end_time !== undefined);

  const rutasRecientes = rutasCompletadas
    .slice()
    .sort((a, b) => {
      const aDate = a.end_time ? new Date(a.end_time) : new Date(a.route_date || 0);
      const bDate = b.end_time ? new Date(b.end_time) : new Date(b.route_date || 0);
      return bDate.getTime() - aDate.getTime();
    })
    .slice(0, 3);

  const formatDateTime = (dateStr: any) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderEmptyCard = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Image
          source={require('../../../assets/act_off_icon.png')}
          style={styles.actIcon}
        />
      </View>
      <Text style={styles.emptyIconText}>No hay rutas</Text>
    </View>
  );

  const renderRouteCard = (route: any) => (
    <TouchableOpacity key={route.id} style={styles.routeCard} activeOpacity={0.8}>
      <View style={styles.routeHeader}>
        <Text style={styles.routeName}>{route.name || 'Sin nombre'}</Text>
        <Text style={styles.timeLabel}>
          {route.route_date ? new Date(route.route_date).toLocaleDateString('es-MX') : '-'}
        </Text>
      </View>

      {route.name && route.description ? (
        <>
          <Text style={styles.routeName}>{route.name}</Text>
          <Text style={styles.routeDesc} numberOfLines={2}>{route.description}</Text>
        </>
      ) : null}

      <View style={styles.routeTimes}>
        <Text style={styles.timeLabel}>
          Inicio: {route.start_time || '-'}
        </Text>
        <Text style={styles.timeLabel}>
          Fin: {route.end_time ? formatDateTime(route.end_time) : '-'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Actividad</Text>
        </View>

        {loading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#5050FF" />
            <Text style={styles.loadingText}>Cargando actividad...</Text>
          </View>
        ) : error ? (
          <View style={{ padding: 20 }}>
            <Text style={{ color: 'red' }}>Error: {error}</Text>
          </View>
        ) : null}

        {/* Rutas actuales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rutas actuales</Text>
          {rutasActuales.length === 0 ? (
            renderEmptyCard()
          ) : (
            rutasActuales.map(route => renderRouteCard(route))
          )}
        </View>

        {/* Rutas recientes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rutas recientes</Text>
          {rutasRecientes.length === 0 ? (
            renderEmptyCard()
          ) : (
            rutasRecientes.map(route => renderRouteCard(route))
          )}
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
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 4,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'left',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5C5C60',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 40,
    marginBottom: 16,
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
  },
  emptyIconText: {
    fontSize: 24,
    opacity: 0.5,
  },
  actIcon: {
    width: 20,
    height: 20,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
  },
  routeDesc: {
    fontSize: 15,
    color: '#444',
    marginVertical: 8,
    textAlign: 'left',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#5050FF',
    textAlign: 'center',
  },
  routeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  routeTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
  }
});

export default Activity;
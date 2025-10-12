import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, safeLogError } from '@/services/supabase';
import { cacheRoutesData, getCachedRoutesData } from '@/services/routesCache';

interface Route {
  id: string;
  name: string;
  description?: string;
  route_date: string;
  start_time?: string;
  end_time?: string;
}

interface RouteWithStatus extends Route {
  status: 'Pendiente' | 'En curso' | 'Finalizada';
  participant_id?: string;
}

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allRoutes, setAllRoutes] = useState<RouteWithStatus[]>([]);
  const [stats, setStats] = useState({
    totalRutasHoy: 0,
    rutasCompletadas: 0,
    rutasSinFinalizar: 0,
  });

  useEffect(() => {
    loadRoutesData();
  }, []);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const loadRoutesData = async () => {
    try {
      // Try to load from encrypted cache first
      const cached = await getCachedRoutesData();
      if (cached) {
        setAllRoutes(cached.routes);
        setStats(cached.stats);
        setLoading(false);
        // Still fetch fresh data in background
        fetchRoutesData(false);
        return;
      }

      // No cache, fetch from database
      await fetchRoutesData(true);
    } catch (error) {
      safeLogError('Error loading routes data', error);
      setLoading(false);
    }
  };

  const fetchRoutesData = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        safeLogError('Error fetching user', userError);
        setLoading(false);
        return;
      }

      const today = getTodayDate();

      // 1. Obtener rutas EN CURSO
      const { data: enCursoData, error: enCursoError } = await supabase
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
        .eq('user_id', user.id)
        .eq('routes.route_date', today)
        .not('routes.start_time', 'is', null)
        .is('routes.end_time', null);

      // 2. Obtener rutas FINALIZADAS
      const { data: finalizadasData, error: finalizadasError } = await supabase
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
        .eq('user_id', user.id)
        .eq('routes.route_date', today)
        .not('routes.end_time', 'is', null);

      // 3. Obtener rutas PENDIENTES
      const { data: pendientesData, error: pendientesError } = await supabase
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
        .is('user_id', null)
        .eq('routes.route_date', today);

      if (enCursoError) safeLogError('Error fetching en curso routes', enCursoError);
      if (finalizadasError) safeLogError('Error fetching finalizadas routes', finalizadasError);
      if (pendientesError) safeLogError('Error fetching pendientes routes', pendientesError);

      // Procesar rutas
      const rutasEnCurso: RouteWithStatus[] = (enCursoData || [])
        .filter((rp: any) => rp.routes)
        .map((rp: any) => ({
          ...rp.routes,
          status: 'En curso' as const,
          participant_id: rp.id,
        }));

      const rutasFinalizadas: RouteWithStatus[] = (finalizadasData || [])
        .filter((rp: any) => rp.routes)
        .map((rp: any) => ({
          ...rp.routes,
          status: 'Finalizada' as const,
          participant_id: rp.id,
        }));

      const rutasPendientes: RouteWithStatus[] = (pendientesData || [])
        .filter((rp: any) => rp.routes)
        .map((rp: any) => ({
          ...rp.routes,
          status: 'Pendiente' as const,
          participant_id: rp.id,
        }));

      const todasLasRutas = [
        ...rutasEnCurso,
        ...rutasPendientes,
        ...rutasFinalizadas,
      ];

      const rutasDelDia = [...rutasEnCurso, ...rutasFinalizadas];
      const newStats = {
        totalRutasHoy: rutasDelDia.length,
        rutasCompletadas: rutasFinalizadas.length,
        rutasSinFinalizar: rutasEnCurso.length,
      };

      setAllRoutes(todasLasRutas);
      setStats(newStats);

      // Cache the data encrypted
      await cacheRoutesData({
        routes: todasLasRutas,
        stats: newStats,
        timestamp: Date.now(),
      });

    } catch (error) {
      safeLogError('Error in fetchRoutesData', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutesData(false);
  };

  const handleRegistrarseRuta = async (participantId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        safeLogError('Error fetching user', userError);
        return;
      }

      const { error } = await supabase
        .from('route_participants')
        .update({ user_id: user.id })
        .eq('id', participantId);

      if (error) {
        safeLogError('Error registering for route', error);
      } else {
        fetchRoutesData(false);
      }
    } catch (error) {
      safeLogError('Error in handleRegistrarseRuta', error);
    }
  };

  const renderStatsCard = (title: string, value: number, color: string) => (
    <View style={[styles.statsCard, { backgroundColor: color }]}>
      <Text style={styles.statsTitle}>{title}</Text>
      <Text style={styles.statsValue}>{value}</Text>
    </View>
  );

  const renderRouteItem = (ruta: RouteWithStatus) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Pendiente':
          return '#5C5C60';
        case 'En curso':
          return '#F5A800';
        case 'Finalizada':
          return '#00953B';
        default:
          return '#5C5C60';
      }
    };

    const getActionButton = () => {
      if (ruta.status === 'Pendiente') {
        return (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#CE0E2D' }]}
            onPress={() => ruta.participant_id && handleRegistrarseRuta(ruta.participant_id)}
          >
            <Text style={styles.actionButtonText}>Registrarse para ruta</Text>
          </TouchableOpacity>
        );
      } else if (ruta.status === 'Finalizada') {
        return (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#00953B' }]}
          >
            <Text style={styles.actionButtonText}>Imprimir PDF</Text>
          </TouchableOpacity>
        );
      }
      return null;
    };

    return (
      <View key={ruta.id} style={styles.routeItem}>
        <Text style={[styles.routeStatus, { color: getStatusColor(ruta.status) }]}>
          {ruta.status}
        </Text>
        
        <View style={styles.routeLocationContainer}>
          <Image
            source={require('../../../assets/location_icon.png')}
            style={styles.locationIcon}
          />
          <Text style={styles.routeLocation}>{ruta.name}</Text>
        </View>

        {ruta.description && (
          <Text style={styles.routeDescription}>{ruta.description}</Text>
        )}

        {ruta.start_time && (
          <Text style={styles.routeTime}>
            🕐 {ruta.start_time.slice(0, 5)}
            {ruta.end_time && ` - ${ruta.end_time.slice(0, 5)}`}
          </Text>
        )}

        <View style={styles.routeActions}>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>ver detalles</Text>
          </TouchableOpacity>
          
          {getActionButton()}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5050FF" />
          <Text style={styles.loadingText}>Cargando rutas...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Panel Staff - Banco de Alimentos</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.mainStatsCard}>
            <Text style={styles.mainStatsTitle}>Total de rutas hoy</Text>
            <Text style={styles.mainStatsValue}>{stats.totalRutasHoy}</Text>
          </View>

          <View style={styles.statsRow}>
            {renderStatsCard('Rutas completadas', stats.rutasCompletadas, '#E8F5E8')}
            {renderStatsCard('Rutas sin finalizar', stats.rutasSinFinalizar, '#FFF3E0')}
          </View>
        </View>

        <View style={styles.routesContainer}>
          {allRoutes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay rutas disponibles hoy</Text>
            </View>
          ) : (
            allRoutes.map(renderRouteItem)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#5C5C60' },
  header: { paddingVertical: 20, paddingHorizontal: 4, paddingTop: 40 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#5C5C60', textAlign: 'left' },
  statsContainer: { marginBottom: 24 },
  mainStatsCard: { backgroundColor: '#E8E3FF', borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center' },
  mainStatsTitle: { fontSize: 14, color: '#5050FF', marginBottom: 8, fontWeight: '500' },
  mainStatsValue: { fontSize: 48, fontWeight: 'bold', color: '#000000' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statsCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statsTitle: { fontSize: 12, color: '#5050FF', marginBottom: 8, fontWeight: '500', textAlign: 'center' },
  statsValue: { fontSize: 32, fontWeight: 'bold', color: '#000000' },
  routesContainer: { marginBottom: 20 },
  routeItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  routeStatus: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  routeLocationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationIcon: { width: 16, height: 16, marginRight: 6 },
  routeLocation: { fontSize: 14, color: '#000000', fontWeight: '500' },
  routeDescription: { fontSize: 13, color: '#5C5C60', marginBottom: 8 },
  routeTime: { fontSize: 12, color: '#666666', marginBottom: 12 },
  routeActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  detailsButton: { backgroundColor: '#5050FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  detailsButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },
  actionButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flex: 1, alignItems: 'center' },
  actionButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#5C5C60', textAlign: 'center' },
});

export default Home;
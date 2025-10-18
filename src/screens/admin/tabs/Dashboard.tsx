import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator
} from 'react-native';
import { supabase } from '@/services/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  RouteDetails: { routeId: string; routeName: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Route {
  id: string;
  name: string;
  description?: string;
  route_date: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

interface RouteWithStatus extends Route {
  status: 'Pendiente' | 'En curso' | 'Finalizada';
}

const Home = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<RouteWithStatus[]>([]);
  const [stats, setStats] = useState({
    totalRutasHoy: 0,
    rutasCompletadas: 0,
    rutasSinFinalizar: 0,
  });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);

      // Obtener todas las rutas
      const { data: allRoutes, error: routesError } = await supabase
        .from('routes')
        .select('*')
        .order('route_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (routesError) {
        console.warn('Error cargando rutas:', routesError);
        return;
      }

      if (!allRoutes) {
        setRoutes([]);
        return;
      }

      // Obtener todos los route_participants
      const { data: participants, error: participantsError } = await supabase
        .from('route_participants')
        .select('route_id, user_id');

      if (participantsError) {
        console.warn('Error cargando participantes:', participantsError);
      }

      // Crear un Set de route_ids que tienen staff asignado
      const routesWithStaff = new Set(
        participants?.map(p => p.route_id) || []
      );

      // Clasificar rutas por estado
      const routesWithStatus: RouteWithStatus[] = allRoutes.map(route => {
        const hasStaff = routesWithStaff.has(route.id);
        const hasEndTime = !!route.end_time;

        let status: 'Pendiente' | 'En curso' | 'Finalizada';
        
        // Prioridad: primero verificar si está finalizada
        if (hasEndTime) {
          status = 'Finalizada';
        } 
        // Luego verificar si tiene staff asignado (en curso)
        else if (hasStaff) {
          status = 'En curso';
        } 
        // Si no tiene ni staff ni hora de fin, está pendiente
        else {
          status = 'Pendiente';
        }

        return {
          ...route,
          status,
        };
      });

      setRoutes(routesWithStatus);

      // Calcular estadísticas (rutas de hoy)
      const today = new Date().toISOString().split('T')[0];
      const rutasHoy = routesWithStatus.filter(r => r.route_date === today);
      
      setStats({
        totalRutasHoy: rutasHoy.length,
        rutasCompletadas: rutasHoy.filter(r => r.status === 'Finalizada').length,
        rutasSinFinalizar: rutasHoy.filter(r => r.status !== 'Finalizada').length,
      });

    } catch (e) {
      console.warn('Excepción cargando rutas:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (route: RouteWithStatus) => {
    navigation.navigate('RouteDetails', {
      routeId: route.id,
      routeName: route.name,
    });
  };

  const handleImprimirPDF = (route: RouteWithStatus) => {
    // TODO: Implementar generación de PDF
    alert(`Imprimir PDF para: ${route.name}`);
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
          <Text style={styles.routeDescription} numberOfLines={2}>
            {ruta.description}
          </Text>
        )}

        <View style={styles.routeActions}>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => handleVerDetalles(ruta)}
          >
            <Text style={styles.detailsButtonText}>ver detalles</Text>
          </TouchableOpacity>
          
          {ruta.status === 'Finalizada' && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#00953B' }]}
              onPress={() => handleImprimirPDF(ruta)}
            >
              <Text style={styles.actionButtonText}>Imprimir PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Separar rutas por estado
  const rutasPendientes = routes.filter(r => r.status === 'Pendiente');
  const rutasEnCurso = routes.filter(r => r.status === 'En curso');
  const rutasFinalizadas = routes.filter(r => r.status === 'Finalizada');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Panel Admin - Banco de Alimentos</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.mainStatsCard}>
            <Text style={styles.mainStatsTitle}>Total de rutas hoy</Text>
            <Text style={styles.mainStatsValue}>{stats.totalRutasHoy}</Text>
          </View>

          <View style={styles.statsRow}>
            {renderStatsCard(
              'Rutas completadas',
              stats.rutasCompletadas,
              '#E8F5E8'
            )}
            {renderStatsCard(
              'Rutas sin finalizar',
              stats.rutasSinFinalizar,
              '#FFF3E0'
            )}
          </View>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5050FF" />
            <Text style={styles.loadingText}>Cargando rutas...</Text>
          </View>
        ) : (
          <>
            {/* Rutas Pendientes */}
            {rutasPendientes.length > 0 && (
              <View style={styles.routesSection}>
                <Text style={styles.sectionTitle}>Pendientes</Text>
                <View style={styles.routesContainer}>
                  {rutasPendientes.map(renderRouteItem)}
                </View>
              </View>
            )}

            {/* Rutas En Curso */}
            {rutasEnCurso.length > 0 && (
              <View style={styles.routesSection}>
                <Text style={styles.sectionTitle}>En curso</Text>
                <View style={styles.routesContainer}>
                  {rutasEnCurso.map(renderRouteItem)}
                </View>
              </View>
            )}

            {/* Rutas Finalizadas */}
            {rutasFinalizadas.length > 0 && (
              <View style={styles.routesSection}>
                <Text style={styles.sectionTitle}>Finalizadas</Text>
                <View style={styles.routesContainer}>
                  {rutasFinalizadas.map(renderRouteItem)}
                </View>
              </View>
            )}

            {/* Empty State */}
            {routes.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No hay rutas disponibles</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#5C5C60',
    textAlign: 'left',
  },
  statsContainer: {
    marginBottom: 24,
  },
  mainStatsCard: {
    backgroundColor: '#E8E3FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  mainStatsTitle: {
    fontSize: 14,
    color: '#5050FF',
    marginBottom: 8,
    fontWeight: '500',
  },
  mainStatsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 12,
    color: '#5050FF',
    marginBottom: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  statsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#5C5C60',
  },
  routesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  routesContainer: {
    marginBottom: 0,
  },
  routeItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  routeLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  routeLocation: {
    fontSize: 14,
    color: '#5C5C60',
    fontWeight: '500',
  },
  routeDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    lineHeight: 18,
  },
  routeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  detailsButton: {
    backgroundColor: '#5050FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
});

export default Home;
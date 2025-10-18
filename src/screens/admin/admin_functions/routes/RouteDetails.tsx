import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/services/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  RouteDetails: { routeId: string; routeName: string };
  Home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'RouteDetails'>;

interface RouteStop {
  id: string;
  route_id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  stop_order?: number;
}

interface AssignedStaff {
  id: string;
  full_name: string;
  phone?: string;
}

export default function RouteDetails({ route, navigation }: Props) {
  const { routeId, routeName: initialRouteName } = route.params;
  
  const [routeName, setRouteName] = useState<string>(initialRouteName);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingStops, setLoadingStops] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  
  const [routeDetails, setRouteDetails] = useState<{
    route_date?: string;
    start_time?: string | null;
    end_time?: string | null;
    description?: string | null;
  } | null>(null);
  
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<AssignedStaff[]>([]);

  const windowHeight = Dimensions.get('window').height;

  // Map state
  const [mapRegion, setMapRegion] = useState({
    latitude: 20.6597,
    longitude: -103.3496,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  // Load route details from DB
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!routeId) return;
      try {
        setLoadingRoute(true);
        const { data, error } = await supabase
          .from('routes')
          .select('name, route_date, start_time, end_time, description')
          .eq('id', routeId)
          .single();
        
        if (error) {
          console.warn('Could not fetch route details', error);
        } else if (mounted && data) {
          setRouteName(data.name ?? initialRouteName);
          setRouteDetails({ 
            route_date: data.route_date,
            start_time: data.start_time ?? null,
            end_time: data.end_time ?? null,
            description: data.description ?? null,
          });
        }
      } catch (e) {
        console.warn('Exception fetching route', e);
      } finally {
        if (mounted) setLoadingRoute(false);
      }
    })();
    return () => { mounted = false; };
  }, [routeId]);

  // Load route stops
  useEffect(() => {
    let mounted = true;
    if (!routeId) return;

    (async () => {
      try {
        setLoadingStops(true);
        const { data, error } = await supabase
          .from('route_stops')
          .select('id, route_id, name, address, latitude, longitude, stop_order')
          .eq('route_id', routeId)
          .order('stop_order', { ascending: true });

        if (error) {
          console.warn('Error loading stops:', error);
        } else if (mounted && data) {
          setRouteStops(data);

          // Center map on first stop
          if (data.length > 0) {
            setMapRegion({
              latitude: data[0].latitude,
              longitude: data[0].longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }
      } catch (e) {
        console.warn('Exception loading stops:', e);
      } finally {
        if (mounted) setLoadingStops(false);
      }
    })();
    return () => { mounted = false; };
  }, [routeId]);

  // Load assigned staff
  useEffect(() => {
    let mounted = true;
    if (!routeId) return;

    (async () => {
      try {
        setLoadingStaff(true);
        
        // First get route participants
        const { data: participants, error: participantsError } = await supabase
          .from('route_participants')
          .select('user_id')
          .eq('route_id', routeId);

        if (participantsError) {
          console.warn('Error loading participants:', participantsError);
        } else if (mounted && participants && participants.length > 0) {
          // Then get user details
          const userIds = participants.map(p => p.user_id);
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, phone')
            .in('id', userIds);

          if (usersError) {
            console.warn('Error loading users:', usersError);
          } else if (users) {
            setAssignedStaff(users);
          }
        }
      } catch (e) {
        console.warn('Exception loading staff:', e);
      } finally {
        if (mounted) setLoadingStaff(false);
      }
    })();
    return () => { mounted = false; };
  }, [routeId]);

  const handleBackToHome = () => {
    navigation.navigate('Home');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Mapa con marcadores */}
      <View style={[styles.mapContainer, { height: windowHeight * 0.4 }]}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
        >
          {routeStops.map((stop, index) => (
            <Marker
              key={stop.id}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
              title={stop.name}
              description={stop.address}
              pinColor="#FF6B35"
            >
              <View style={styles.customMarker}>
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        <TouchableOpacity
          style={styles.overlayBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.overlayBackIcon}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Título */}
      <Text style={styles.title}>Detalles de Ruta</Text>

      {/* Tarjeta de detalles */}
      <View style={styles.detailsCard}>
        {/* Lugar de Destino (antes era Nombre/ID Ruta) */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Lugar de Destino</Text>
          <Text style={styles.detailValue}>
            {loadingRoute ? 'Cargando...' : routeName}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Fecha */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fecha</Text>
          <Text style={styles.detailValue}>
            {routeDetails?.route_date ?? '-'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Hora de inicio */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Hora de inicio</Text>
          <Text style={styles.detailValue}>
            {routeDetails?.start_time 
              ? routeDetails.start_time.slice(0, 5)
              : '-'
            }
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Hora de fin */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Hora de fin</Text>
          <Text style={styles.detailValue}>
            {routeDetails?.end_time 
              ? routeDetails.end_time.slice(0, 5)
              : '-'
            }
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Encargado(s) */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Encargado(s)</Text>
          <View style={styles.detailValueContainer}>
            {loadingStaff ? (
              <ActivityIndicator size="small" color="#666" />
            ) : assignedStaff.length > 0 ? (
              <View style={styles.staffList}>
                {assignedStaff.map((staff, index) => (
                  <Text key={staff.id} style={styles.detailValue}>
                    {staff.full_name}{index < assignedStaff.length - 1 ? ', ' : ''}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.detailValue}>Sin asignar</Text>
            )}
          </View>
        </View>

        {/* Descripción si existe */}
        {routeDetails?.description && (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRowVertical}>
              <Text style={styles.detailLabel}>Descripción</Text>
              <Text style={styles.detailValueText}>
                {routeDetails.description}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Botón */}
      <TouchableOpacity
        style={styles.selectButton}
        onPress={handleBackToHome}
        activeOpacity={0.8}
      >
        <Text style={styles.selectButtonText}>Volver a Panel Principal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
  },
  mapContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 16,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  overlayBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  overlayBackIcon: {
    marginTop: -12,
    fontSize: 40,
    color: '#000',
    fontWeight: '900',
    lineHeight: 34,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailRowVertical: {
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
    textAlign: 'right',
  },
  detailValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailValueText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '400',
    marginTop: 6,
    lineHeight: 20,
  },
  staffList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  selectButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 4,
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
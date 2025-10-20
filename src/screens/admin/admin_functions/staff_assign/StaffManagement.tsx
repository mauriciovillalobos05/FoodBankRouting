import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/services/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  RouteManagement: { id?: string; location?: string; status?: 'Pendiente' | 'En curso' | 'Finalizada'; participant_id?: string } | undefined;
  RouteDetails: { routeId: string; routeName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'RouteManagement'>;

interface Route {
  id: string;
  name: string;
  description?: string;
  route_date?: string;
  start_time?: string;
  end_time?: string;
}

interface RouteStop {
  id: string;
  route_id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  stop_order?: number;
}

interface StaffUser {
  id: string;
  full_name: string;
  phone?: string;
}

export default function RouteManagement({ route, navigation }: Props) {
  const windowHeight = Dimensions.get('window').height;

  // State para rutas y stops
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingStops, setLoadingStops] = useState(false);

  // State para staff
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  // Dropdown state
  const [routeDropdownOpen, setRouteDropdownOpen] = useState(false);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Map state
  const [mapRegion, setMapRegion] = useState({
    latitude: 20.6597,
    longitude: -103.3496,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  // Cargar todas las rutas disponibles
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingRoutes(true);
        const { data, error } = await supabase
          .from('routes')
          .select('id, name, description, route_date, start_time, end_time')
          .order('route_date', { ascending: false });

        if (error) {
          console.warn('Error cargando rutas:', error);
          Alert.alert('Error', 'No se pudieron cargar las rutas');
        } else if (mounted && data) {
          setRoutes(data);
        }
      } catch (e) {
        console.warn('Excepción cargando rutas:', e);
      } finally {
        if (mounted) setLoadingRoutes(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Cargar staff users
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingStaff(true);
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, phone')
          .eq('role', 'staff')
          .order('full_name', { ascending: true });

        if (error) {
          console.warn('Error cargando staff:', error);
        } else if (mounted && data) {
          setStaffUsers(data);
        }
      } catch (e) {
        console.warn('Excepción cargando staff:', e);
      } finally {
        if (mounted) setLoadingStaff(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Cargar stops cuando se selecciona una ruta
  useEffect(() => {
    let mounted = true;
    if (!selectedRoute) {
      setRouteStops([]);
      return;
    }

    (async () => {
      try {
        setLoadingStops(true);
        const { data, error } = await supabase
          .from('route_stops')
          .select('id, route_id, name, address, latitude, longitude, stop_order')
          .eq('route_id', selectedRoute.id)
          .order('stop_order', { ascending: true });

        if (error) {
          console.warn('Error cargando stops:', error);
        } else if (mounted && data) {
          setRouteStops(data);

          // Centrar mapa en el primer stop
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
        console.warn('Excepción cargando stops:', e);
      } finally {
        if (mounted) setLoadingStops(false);
      }
    })();
    return () => { mounted = false; };
  }, [selectedRoute]);

  const handleAssignStaff = async () => {
    if (!selectedRoute) {
      Alert.alert('Atención', 'Por favor selecciona una ruta');
      return;
    }

    if (!selectedStaff) {
      Alert.alert('Atención', 'Por favor selecciona un miembro del staff');
      return;
    }

    try {
      // Insertar participante en route_participants
      const { error } = await supabase
        .from('route_participants')
        .insert({
          route_id: selectedRoute.id,
          user_id: selectedStaff.id,
          assigned_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Error asignando staff:', error);
        Alert.alert('Error', 'No se pudo asignar el staff a la ruta');
      } else {
        Alert.alert(
          'Éxito',
          `${selectedStaff.full_name} ha sido asignado(a) a ${selectedRoute.name}`,
          [
            {
              text: 'Ver detalles',
              onPress: () => navigation.navigate('RouteDetails', {
                routeId: selectedRoute.id,
                routeName: selectedRoute.name,
              }),
            },
            { text: 'OK' }
          ]
        );
        // Limpiar selección
        setSelectedStaff(null);
      }
    } catch (e) {
      console.warn('Excepción asignando staff:', e);
      Alert.alert('Error', 'Ocurrió un error al asignar el staff');
    }
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
              pinColor={selectedRoute ? '#FF6B35' : '#4A90E2'}
            >
              <View style={[
                styles.customMarker,
                { backgroundColor: selectedRoute ? '#FF6B35' : '#4A90E2' }
              ]}>
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
      <Text style={styles.title}>Asignar Staff a Ruta</Text>

      {/* Dropdown de rutas */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Selecciona una ruta *</Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={() => setRouteDropdownOpen((s) => !s)}
            disabled={loadingRoutes}
          >
            <View style={styles.dropdownToggleContent}>
              <Text style={[styles.dropdownLabel, !selectedRoute && styles.placeholderText]}>
                {loadingRoutes 
                  ? 'Cargando rutas...' 
                  : selectedRoute 
                    ? selectedRoute.name 
                    : 'Selecciona una ruta'}
              </Text>
              {loadingRoutes ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <Text style={[styles.dropdownArrow, routeDropdownOpen && styles.dropdownArrowOpen]}>
                  {routeDropdownOpen ? '▴' : '▾'}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {routeDropdownOpen && !loadingRoutes && (
            <View style={styles.dropdownList}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {routes.length === 0 ? (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.placeholderText}>No hay rutas disponibles</Text>
                  </View>
                ) : (
                  routes.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.dropdownItem,
                        selectedRoute?.id === r.id && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setSelectedRoute(r);
                        setRouteDropdownOpen(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedRoute?.id === r.id && styles.dropdownItemTextSelected
                      ]}>
                        {r.name}
                      </Text>
                      {r.route_date && (
                        <Text style={styles.dropdownItemSubtext}>
                          {r.route_date}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Detalles de la ruta seleccionada */}
      {selectedRoute && (
        <View style={styles.detailsContainer}>
          {selectedRoute.description && (
            <Text style={styles.detailText}>
              {selectedRoute.description}
            </Text>
          )}
          <Text style={styles.detailText}>
            Fecha: {selectedRoute.route_date ?? '-'}
          </Text>
          <Text style={styles.detailText}>
            Hora: {selectedRoute.start_time 
              ? `${selectedRoute.start_time.slice(0, 5)}${selectedRoute.end_time ? ` - ${selectedRoute.end_time.slice(0, 5)}` : ''}` 
              : '-'
            }
          </Text>
          <Text style={styles.detailText}>
            Puntos de entrega: {routeStops.length}
          </Text>
        </View>
      )}

      {/* Indicador de carga de stops */}
      {loadingStops && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={styles.loadingText}>Cargando puntos de entrega...</Text>
        </View>
      )}

      {/* Dropdown de Staff */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Selecciona staff *</Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={() => setStaffDropdownOpen((s) => !s)}
            disabled={loadingStaff}
          >
            <View style={styles.dropdownToggleContent}>
              <Text style={[styles.dropdownLabel, !selectedStaff && styles.placeholderText]}>
                {loadingStaff 
                  ? 'Cargando staff...' 
                  : selectedStaff
                    ? selectedStaff.full_name
                    : 'Selecciona un miembro del staff'}
              </Text>
              {loadingStaff ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <Text style={[styles.dropdownArrow, staffDropdownOpen && styles.dropdownArrowOpen]}>
                  {staffDropdownOpen ? '▴' : '▾'}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {staffDropdownOpen && !loadingStaff && (
            <View style={styles.dropdownList}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {staffUsers.length === 0 ? (
                  <View style={styles.dropdownItem}>
                    <Text style={styles.placeholderText}>No hay staff disponible</Text>
                  </View>
                ) : (
                  staffUsers.map((staff) => (
                    <TouchableOpacity
                      key={staff.id}
                      style={[
                        styles.dropdownItem,
                        selectedStaff?.id === staff.id && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setSelectedStaff(staff);
                        setStaffDropdownOpen(false);
                      }}
                    >
                      <View style={styles.staffInfo}>
                        <Text style={[
                          styles.dropdownItemText,
                          selectedStaff?.id === staff.id && styles.dropdownItemTextSelected
                        ]}>
                          {staff.full_name}
                        </Text>
                        {staff.phone && (
                          <Text style={styles.dropdownItemSubtext}>
                            {staff.phone}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Staff seleccionado */}
      {selectedStaff && (
        <View style={styles.selectedStaffContainer}>
          <Text style={styles.selectedStaffTitle}>Staff seleccionado:</Text>
          <View style={styles.selectedStaffItem}>
            <Text style={styles.selectedStaffName}>{selectedStaff.full_name}</Text>
            <TouchableOpacity
              onPress={() => setSelectedStaff(null)}
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Botón Asignar Staff */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          (!selectedRoute || !selectedStaff) && styles.selectButtonDisabled
        ]}
        onPress={handleAssignStaff}
        activeOpacity={0.8}
        disabled={!selectedRoute || !selectedStaff}
      >
        <Text style={styles.selectButtonText}>
          Asignar Staff a Ruta
        </Text>
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
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
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
  detailsContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dropdownContainer: {
    zIndex: 1000,
  },
  dropdownToggle: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdownToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownLabel: {
    color: '#222',
    flex: 1,
    fontSize: 15,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    color: '#666',
    marginLeft: 12,
    fontSize: 16,
  },
  dropdownArrowOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#222',
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: '#000',
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  staffItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffInfo: {
    flex: 1,
  },
  selectedStaffContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedStaffTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  selectedStaffItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginBottom: 6,
  },
  selectedStaffName: {
    fontSize: 14,
    color: '#222',
    flex: 1,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  selectButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  selectButtonDisabled: {
    backgroundColor: '#ccc',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
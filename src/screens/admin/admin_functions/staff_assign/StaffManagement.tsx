import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/services/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  StaffManagement: { route_id?: string };
  RouteManagement: { id: string; location?: string; selectedStaffIds?: string[] };
};

type Props = NativeStackScreenProps<RootStackParamList, 'StaffManagement'>;

interface Staff {
  id: string;
  full_name: string;
  role: string;
}

interface Route {
  id: string;
  name: string;
  route_date: string;
}

const StaffManagement = ({ navigation, route }: Props) => {
  const route_id = route.params?.route_id;
  
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(route_id || null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [routeList, setRouteList] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Cargar staff disponible desde Supabase
  useEffect(() => {
    loadAvailableStaff();
    loadAvailableRoutes();
  }, []);

  const loadAvailableStaff = async () => {
    try {
      setLoading(true);
      
      const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, role');
      
      if (error) throw error;
      
      setStaffList(users || []);
    } catch (error) {
      console.error('Error loading staff:', error);
      Alert.alert('Error', 'No se pudo cargar el listado de staff');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableRoutes = async () => {
    try {
      setLoadingRoutes(true);
      
      const { data: routes, error } = await supabase
        .from('routes')
        .select('id, name, route_date')
        .order('route_date', { ascending: false });
      
      if (error) throw error;
      
      setRouteList(routes || []);
    } catch (error) {
      console.error('Error loading routes:', error);
      Alert.alert('Error', 'No se pudo cargar el listado de rutas');
    } finally {
      setLoadingRoutes(false);
    }
  };

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(s => s !== staffId)
        : [...prev, staffId]
    );
  };

  const handleContinue = () => {
    if (selectedStaff.length === 0) {
      Alert.alert('Atención', 'Por favor selecciona al menos un miembro del staff');
      return;
    }

    if (!selectedRoute) {
      Alert.alert('Atención', 'Por favor selecciona una ruta');
      return;
    }

    // Navegar a RouteManagement con el staff seleccionado
    navigation.navigate('RouteManagement', { 
      id: selectedRoute,
      selectedStaffIds: selectedStaff
    });
  };

  const getSelectedRouteName = () => {
    const route = routeList.find(r => r.id === selectedRoute);
    return route ? `${route.name} - ${route.route_date}` : 'Seleccionar ruta';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Administrar Staff</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Route Selection Dropdown */}
        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Seleccionar Ruta</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
            disabled={loadingRoutes}
          >
            <Text style={[
              styles.dropdownText,
              !selectedRoute && styles.placeholderText
            ]}>
              {loadingRoutes ? 'Cargando rutas...' : getSelectedRouteName()}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {/* Route List */}
          {isRouteDropdownOpen && (
            <View style={styles.staffList}>
              {loadingRoutes ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#5050FF" />
                </View>
              ) : routeList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No hay rutas disponibles</Text>
                </View>
              ) : (
                routeList.map((routeItem) => (
                  <TouchableOpacity
                    key={routeItem.id}
                    style={[
                      styles.staffItem,
                      selectedRoute === routeItem.id && styles.staffItemSelected
                    ]}
                    onPress={() => {
                      setSelectedRoute(routeItem.id);
                      setIsRouteDropdownOpen(false);
                    }}
                  >
                    <View style={styles.staffItemContent}>
                      <View style={styles.staffInfo}>
                        <Text style={[
                          styles.staffItemText,
                          selectedRoute === routeItem.id && styles.staffItemTextSelected
                        ]}>
                          {routeItem.name}
                        </Text>
                        <Text style={styles.staffRole}>{routeItem.route_date}</Text>
                      </View>
                      {selectedRoute === routeItem.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Staff Selection Dropdown */}
        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Seleccionar Staff</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
            disabled={loading}
          >
            <Text style={styles.dropdownText}>
              {loading ? 'Cargando staff...' : 'Staff disponible para la ruta'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {/* Staff List */}
          {isStaffDropdownOpen && (
            <View style={styles.staffList}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#5050FF" />
                </View>
              ) : staffList.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No hay staff disponible</Text>
                </View>
              ) : (
                staffList.map((staff) => (
                  <TouchableOpacity
                    key={staff.id}
                    style={[
                      styles.staffItem,
                      selectedStaff.includes(staff.id) && styles.staffItemSelected
                    ]}
                    onPress={() => toggleStaffSelection(staff.id)}
                  >
                    <View style={styles.staffItemContent}>
                      <View style={styles.staffInfo}>
                        <Text style={[
                          styles.staffItemText,
                          selectedStaff.includes(staff.id) && styles.staffItemTextSelected
                        ]}>
                          {staff.full_name}
                        </Text>
                        <Text style={styles.staffRole}>{staff.role}</Text>
                      </View>
                      {selectedStaff.includes(staff.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Selected Count */}
        {selectedStaff.length > 0 && (
          <View style={styles.selectedCountContainer}>
            <Text style={styles.selectedCountText}>
              {selectedStaff.length} miembro{selectedStaff.length !== 1 ? 's' : ''} seleccionado{selectedStaff.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.continueButton,
              (selectedStaff.length === 0 || !selectedRoute) && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={selectedStaff.length === 0 || !selectedRoute}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 18,
    color: '#5C5C60',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#5C5C60',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C5C60',
    marginBottom: 8,
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#5C5C60',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#5C5C60',
  },
  staffList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  staffItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  staffItemSelected: {
    backgroundColor: '#E8E3FF',
  },
  staffItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffInfo: {
    flex: 1,
  },
  staffItemText: {
    fontSize: 16,
    color: '#5C5C60',
    marginBottom: 4,
  },
  staffItemTextSelected: {
    color: '#5050FF',
    fontWeight: '500',
  },
  staffRole: {
    fontSize: 13,
    color: '#999',
  },
  checkmark: {
    fontSize: 20,
    color: '#5050FF',
    fontWeight: 'bold',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  selectedCountContainer: {
    backgroundColor: '#E8E3FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  selectedCountText: {
    fontSize: 14,
    color: '#5050FF',
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '80%',
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StaffManagement;
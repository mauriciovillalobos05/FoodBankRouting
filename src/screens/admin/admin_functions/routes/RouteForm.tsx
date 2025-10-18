import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { supabase } from '@/services/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  RouteForm: undefined;
  RouteDetails: { routeId: string; routeName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'RouteForm'>;

interface StaffUser {
  id: string;
  full_name: string;
  phone?: string;
}

export default function RouteForm({ navigation }: Props) {
  // Form fields
  const [routeName, setRouteName] = useState('');
  const [routeDate, setRouteDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  
  // Staff
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
  
  // Loading state
  const [saving, setSaving] = useState(false);

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

  const validateForm = () => {
    if (!routeName.trim()) {
      Alert.alert('Atención', 'Por favor ingresa el nombre de la ruta');
      return false;
    }
    if (!routeDate.trim()) {
      Alert.alert('Atención', 'Por favor ingresa la fecha');
      return false;
    }
    if (!startTime.trim()) {
      Alert.alert('Atención', 'Por favor ingresa la hora de inicio');
      return false;
    }
    if (!latitude.trim()) {
      Alert.alert('Atención', 'Por favor ingresa la latitud');
      return false;
    }
    if (!longitude.trim()) {
      Alert.alert('Atención', 'Por favor ingresa la longitud');
      return false;
    }
    if (!selectedStaff) {
      Alert.alert('Atención', 'Por favor selecciona un encargado');
      return false;
    }
    return true;
  };

  const handleSaveRoute = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // 1. Crear la ruta
      const { data: newRoute, error: routeError } = await supabase
        .from('routes')
        .insert({
          name: routeName.trim(),
          description: description.trim() || null,
          route_date: routeDate,
          start_time: startTime,
          end_time: endTime || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (routeError || !newRoute) {
        console.warn('Error creando ruta:', routeError);
        Alert.alert('Error', 'No se pudo crear la ruta');
        return;
      }

      // 2. Crear la parada en route_stops
      const { error: stopError } = await supabase
        .from('route_stops')
        .insert({
          route_id: newRoute.id,
          stop_order: 1,
          name: routeName.trim(),
          address: routeName.trim(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          scheduled_time: startTime,
          created_at: new Date().toISOString(),
        });

      if (stopError) {
        console.warn('Error creando parada:', stopError);
        Alert.alert('Advertencia', 'La ruta se creó pero no se pudo crear la parada');
      }

      // 3. Asignar staff a la ruta
      const { error: participantError } = await supabase
        .from('route_participants')
        .insert({
          route_id: newRoute.id,
          user_id: selectedStaff!.id,
          assigned_at: new Date().toISOString(),
        });

      if (participantError) {
        console.warn('Error asignando staff:', participantError);
        Alert.alert('Advertencia', 'La ruta se creó pero no se pudo asignar el staff');
      }

      // 4. Navegar a RouteDetails
      Alert.alert(
        'Éxito',
        'La ruta se ha creado correctamente',
        [
          {
            text: 'Ver detalles',
            onPress: () => navigation.navigate('RouteDetails', {
              routeId: newRoute.id,
              routeName: newRoute.name,
            }),
          },
        ]
      );

    } catch (e) {
      console.warn('Excepción guardando ruta:', e);
      Alert.alert('Error', 'Ocurrió un error al guardar la ruta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nueva Ruta</Text>
      </View>

      {/* Nombre de la ruta */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Nombre de la ruta *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Ruta Centro - Norte"
          placeholderTextColor="#999"
          value={routeName}
          onChangeText={setRouteName}
          editable={!saving}
        />
      </View>

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ej: Entrega de productos zona norte"
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          editable={!saving}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Fecha */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Fecha *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
          value={routeDate}
          onChangeText={setRouteDate}
          editable={!saving}
        />
        <Text style={styles.helperText}>Formato: 2025-10-17</Text>
      </View>

      {/* Hora de inicio */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Hora de inicio *</Text>
        <TextInput
          style={styles.input}
          placeholder="HH:MM:SS"
          placeholderTextColor="#999"
          value={startTime}
          onChangeText={setStartTime}
          editable={!saving}
        />
        <Text style={styles.helperText}>Formato: 08:00:00</Text>
      </View>

      {/* Hora de fin (opcional) */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Hora de fin (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="HH:MM:SS"
          placeholderTextColor="#999"
          value={endTime}
          onChangeText={setEndTime}
          editable={!saving}
        />
        <Text style={styles.helperText}>Formato: 18:00:00</Text>
      </View>

      {/* Latitud */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Latitud *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 20.6597"
          placeholderTextColor="#999"
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numeric"
          editable={!saving}
        />
        <Text style={styles.helperText}>Coordenada de latitud del punto de inicio</Text>
      </View>

      {/* Longitud */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Longitud *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: -103.3496"
          placeholderTextColor="#999"
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numeric"
          editable={!saving}
        />
        <Text style={styles.helperText}>Coordenada de longitud del punto de inicio</Text>
      </View>

      {/* Dropdown de Staff */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Encargado *</Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={() => setStaffDropdownOpen((s) => !s)}
            disabled={loadingStaff || saving}
          >
            <View style={styles.dropdownToggleContent}>
              <Text style={[styles.dropdownLabel, !selectedStaff && styles.placeholderText]}>
                {loadingStaff 
                  ? 'Cargando staff...' 
                  : selectedStaff
                    ? selectedStaff.full_name
                    : 'Selecciona un encargado'}
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
          <Text style={styles.selectedStaffTitle}>Encargado seleccionado:</Text>
          <View style={styles.selectedStaffItem}>
            <Text style={styles.selectedStaffName}>{selectedStaff.full_name}</Text>
            <TouchableOpacity
              onPress={() => setSelectedStaff(null)}
              style={styles.removeButton}
              disabled={saving}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Botón Guardar Ruta */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          saving && styles.selectButtonDisabled
        ]}
        onPress={handleSaveRoute}
        activeOpacity={0.8}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.selectButtonText}>Guardar Ruta</Text>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    flex: 1,
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
  input: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 15,
    color: '#222',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
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
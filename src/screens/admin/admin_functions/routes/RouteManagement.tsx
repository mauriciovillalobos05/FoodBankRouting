import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { supabase } from '@/services/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  RouteManagement: { id?: string; location?: string; status?: 'Pendiente' | 'En curso' | 'Finalizada'; participant_id?: string } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'RouteManagement'>;

export default function RouteManagement({ route, navigation }: Props) {
  const { id, location } = route.params || {};
  const status = (route.params as any)?.status as 'Pendiente' | 'En curso' | 'Finalizada' | undefined;
  const participantIdParam = (route.params as any)?.participant_id as string | undefined;
  
  const [routeName, setRouteName] = useState<string | undefined>(location);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(participantIdParam ?? null);
  const [routeDetails, setRouteDetails] = useState<{ route_date?: string; start_time?: string | null; end_time?: string | null } | null>(null);

  // Dropdown / Zonas de entrega
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const zones = Array.from({ length: 5 }, (_, i) => `Nombre / ID ruta ${i + 1}`);
  const windowHeight = Dimensions.get('window').height;

  // Load route details from DB
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id || location) return;
      try {
        setLoadingRoute(true);
        const { data, error } = await supabase
          .from('routes')
          .select('name, route_date, start_time, end_time')
          .eq('id', String(id))
          .single();
        
        if (error) {
          console.warn('Could not fetch route details', error);
        } else if (mounted) {
          setRouteName(data?.name ?? undefined);
          setRouteDetails({ 
            route_date: data?.route_date, 
            start_time: data?.start_time ?? null, 
            end_time: data?.end_time ?? null 
          });
        }
      } catch (e) {
        console.warn('Exception fetching route', e);
      } finally {
        if (mounted) setLoadingRoute(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, location]);

  // Check whether current user is registered for this route
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          if (mounted) setIsRegistered(false);
          return;
        }

        if (participantIdParam) {
          const { data: rp, error: rpError } = await supabase
            .from('route_participants')
            .select('id, user_id')
            .eq('id', participantIdParam)
            .single();
          
          if (!rp || rpError) {
            if (mounted) setIsRegistered(false);
            return;
          }
          if (mounted) {
            setParticipantId(rp.id ?? null);
            setIsRegistered(Boolean(rp.user_id === user.id));
          }
          return;
        }

        const { data: found, error: findError } = await supabase
          .from('route_participants')
          .select('id, user_id')
          .eq('route_id', id)
          .eq('user_id', user.id)
          .single();
        
        if (found && !findError) {
          if (mounted) {
            setParticipantId(found.id);
            setIsRegistered(true);
          }
        } else if (mounted) {
          setIsRegistered(false);
        }
      } catch (e) {
        console.warn('Error checking registration', e);
        if (mounted) setIsRegistered(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, participantIdParam]);

  const handleSelectPress = () => {
    if (!selectedZone) {
      Alert.alert('Atención', 'Por favor selecciona una zona de entrega');
      return;
    }
    Alert.alert('Seleccionado', `Has seleccionado: ${selectedZone}`);
    // Aquí puedes agregar la lógica adicional que necesites
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Image full width and half screen height with back button overlay */}
      <View style={[styles.mapPlaceholder, { height: windowHeight * 0.5 }]}>
        <Image
          source={require('../../../../assets/map_stock_img.png')}
          style={styles.mapImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.overlayBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.overlayBackIcon}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Route Name */}
      {loadingRoute ? (
        <Text style={styles.title}>Cargando...</Text>
      ) : (
        <Text style={styles.title}>{routeName || 'Ruta sin nombre'}</Text>
      )}

      {/* Route Details */}
      {routeDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            Fecha: {routeDetails.route_date ?? '-'}
          </Text>
          <Text style={styles.detailText}>
            Hora: {routeDetails.start_time 
              ? `${routeDetails.start_time.slice(0, 5)}${routeDetails.end_time ? ` - ${routeDetails.end_time.slice(0, 5)}` : ''}` 
              : '-'
            }
          </Text>
        </View>
      )}

      {/* Dropdown Zonas de entrega */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={styles.dropdownToggle}
          onPress={() => setDropdownOpen((s) => !s)}
        >
          <View style={styles.dropdownToggleContent}>
            <Text style={[styles.dropdownLabel, !selectedZone && styles.placeholderText]}>
              {selectedZone ?? 'Zonas de entrega'}
            </Text>
            <Text style={[styles.dropdownArrow, dropdownOpen && styles.dropdownArrowOpen]}>
              {dropdownOpen ? '▴' : '▾'}
            </Text>
          </View>
        </TouchableOpacity>
        {dropdownOpen && (
          <View style={styles.dropdownList}>
            {zones.map((z) => (
              <TouchableOpacity
                key={z}
                style={[
                  styles.dropdownItem,
                  selectedZone === z && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  setSelectedZone(z);
                  setDropdownOpen(false);
                }}
              >
                <Text style={selectedZone === z && styles.dropdownItemTextSelected}>
                  {z}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Botón Seleccionar */}
      <TouchableOpacity
        style={[styles.selectButton, !selectedZone && styles.selectButtonDisabled]}
        onPress={handleSelectPress}
        activeOpacity={0.8}
        disabled={!selectedZone}
      >
        <Text style={styles.selectButtonText}>Seleccionar</Text>
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
    marginBottom: 12,
  },
  mapPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapImage: {
    width: '100%',
    height: '100%',
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
    backgroundColor: 'rgba(187, 183, 183, 0.55)',
    zIndex: 20,
    shadowColor: 'rgba(187, 183, 183, 0.55)',
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
    paddingVertical: 8,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dropdownContainer: {
    marginBottom: 16,
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
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: '#000',
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
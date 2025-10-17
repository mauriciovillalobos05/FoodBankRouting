import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { supabase } from '@/services/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  RouteDetails: { id?: string; location?: string; status?: 'Pendiente' | 'En curso' | 'Finalizada'; participant_id?: string } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'RouteDetails'>;

export default function RouteDetails({ route, navigation }: Props) {
  const { id, location } = route.params || {};
  const status = (route.params as any)?.status as 'Pendiente' | 'En curso' | 'Finalizada' | undefined;
  const participantIdParam = (route.params as any)?.participant_id as string | undefined;
  
  const [routeName, setRouteName] = useState<string | undefined>(location);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeDetails, setRouteDetails] = useState<{
    route_date?: string;
    start_time?: string | null;
    end_time?: string | null;
    start_point?: string | null;
    end_point?: string | null;
    supervisor?: string | null;
    max_capacity?: number | null;
  } | null>(null);

  const windowHeight = Dimensions.get('window').height;

  // Load route details from DB
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        setLoadingRoute(true);
        const { data, error } = await supabase
          .from('routes')
          .select('name, route_date, start_time, end_time, start_point, end_point, supervisor, max_capacity')
          .eq('id', String(id))
          .single();
        
        if (error) {
          console.warn('Could not fetch route details', error);
        } else if (mounted && data) {
          setRouteName(data.name ?? undefined);
          setRouteDetails({ 
            route_date: data.route_date,
            start_time: data.start_time ?? null,
            end_time: data.end_time ?? null,
            start_point: data.start_point ?? null,
            end_point: data.end_point ?? null,
            supervisor: data.supervisor ?? null,
            max_capacity: data.max_capacity ?? null,
          });
        }
      } catch (e) {
        console.warn('Exception fetching route', e);
      } finally {
        if (mounted) setLoadingRoute(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleModifyRoute = () => {
    // Aquí navegarías a la pantalla de edición de ruta
    console.log('Modificar ruta:', id);
    // navigation.navigate('EditRoute', { id });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Image reduced height with back button overlay */}
      <View style={[styles.mapPlaceholder, { height: windowHeight * 0.35 }]}>
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

      {/* Section Title */}
      <Text style={styles.sectionTitle}>Detalles de Ruta</Text>

      {/* Route Details Card */}
      <View style={styles.detailsCard}>
        {/* Route Name/ID */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Nombre/ID Ruta</Text>
          <Text style={styles.detailValue}>
            {loadingRoute ? 'Cargando...' : routeName || 'Sin nombre'}
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

        {/* Hora */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Hora</Text>
          <Text style={styles.detailValue}>
            {routeDetails?.start_time 
              ? `${routeDetails.start_time.slice(0, 5)}${routeDetails.end_time ? ` - ${routeDetails.end_time.slice(0, 5)}` : ''}` 
              : '-'
            }
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Punto de inicio */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Punto de inicio</Text>
          <Text style={styles.detailValue}>
            {routeDetails?.start_point ?? '-'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Punto de fin */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Punto de fin</Text>
          <Text style={styles.detailValue}>
            {routeDetails?.end_point ?? '-'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Encargado */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Encargado</Text>
          <Text style={styles.detailValue}>
            {routeDetails?.supervisor ?? '-'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Cupos */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cupos</Text>
          <Text style={styles.detailValue}>
            {routeDetails?.max_capacity ?? '-'}
          </Text>
        </View>
      </View>

      {/* Modify Button */}
      <TouchableOpacity
        style={styles.modifyButton}
        onPress={handleModifyRoute}
        activeOpacity={0.8}
      >
        <Text style={styles.modifyButtonText}>Modificar ruta</Text>
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
  mapPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#222',
    marginBottom: 14,
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
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  modifyButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 4,
  },
  modifyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
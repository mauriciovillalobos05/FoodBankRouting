import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeStackParamList = {
  HomeMain: undefined;
  RouteConfirm: { id?: number; location?: string } | undefined;
};

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

const Home = () => {
  // Datos mock para el template
  const statsData = {
    totalRutasHoy: 0,
    rutasCompletadas: 0,
    rutasSinFinalizar: 0,
  };

  const rutasData = [
    {
      id: 1,
      status: 'Pendiente',
      location: 'Barrio Santiago Norte',
      type: 'ver detalles',
      action: 'Registrarse para ruta',
    },
    {
      id: 2,
      status: 'En curso',
      location: 'Barrio Santiago Norte',
      type: 'ver detalles',
      action: null,
    },
    {
      id: 3,
      status: 'Finalizada',
      location: 'Barrio Santiago Norte',
      type: 'ver detalles',
      action: 'Imprimir PDF',
    },
  ];
  const navigation = useNavigation<NavigationProp>();

  const renderStatsCard = (title: string, value: number, color: string) => (
    <View style={[styles.statsCard, { backgroundColor: color }]}>
      <Text style={styles.statsTitle}>{title}</Text>
      <Text style={styles.statsValue}>{value}</Text>
    </View>
  );

  const renderRouteItem = (ruta: any) => {
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

    const getActionButtonStyle = (action: string | null) => {
      if (action === 'Registrarse para ruta') {
        return { backgroundColor: '#CE0E2D' };
      } else if (action === 'Imprimir PDF') {
        return { backgroundColor: '#00953B' };
      }
      return { backgroundColor: '#5050FF' }; // Color por defecto para "ver detalles"
    };

    return (
      <View key={ruta.id} style={styles.routeItem}>
        <Text style={[styles.routeStatus, { color: getStatusColor(ruta.status) }]}>
          {ruta.status}
        </Text>
        
        <View style={styles.routeLocationContainer}>
          <Text style={styles.locationIcon}>
            <Image
                source={require('../../../assets/location_icon.png')}
                style={styles.locationIcon}
            />
          </Text>
          <Text style={styles.routeLocation}>{ruta.location}</Text>
        </View>

        <View style={styles.routeActions}>
          <TouchableOpacity style={styles.detailsButton} onPress={() => navigation.navigate('RouteConfirm', { id: ruta.id, location: ruta.location })}>
            <Text style={styles.detailsButtonText}>{ruta.type}</Text>
          </TouchableOpacity>
          
          {ruta.action && (
            <TouchableOpacity 
              style={[styles.actionButton, getActionButtonStyle(ruta.action)]}
            >
              <Text style={styles.actionButtonText}>{ruta.action}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Panel Staff - Banco de Alimentos</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.mainStatsCard}>
            <Text style={styles.mainStatsTitle}>Total de rutas hoy</Text>
            <Text style={styles.mainStatsValue}>{statsData.totalRutasHoy}</Text>
          </View>

          <View style={styles.statsRow}>
            {renderStatsCard(
              'Rutas completadas',
              statsData.rutasCompletadas,
              '#E8F5E8'
            )}
            {renderStatsCard(
              'Rutas sin finalizar',
              statsData.rutasSinFinalizar,
              '#FFF3E0'
            )}
          </View>
        </View>

        {/* Routes List */}
        <View style={styles.routesContainer}>
          {rutasData.map(renderRouteItem)}
        </View>
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
  routesContainer: {
    marginBottom: 20,
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
    marginBottom: 12,
  },
  locationIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  routeLocation: {
    fontSize: 14,
    color: '#5C5C60',
    marginLeft: 4,
  },
  routeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
});

export default Home;
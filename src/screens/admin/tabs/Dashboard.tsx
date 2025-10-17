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

const Home = ({navigation}: any) => {
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
    },
    {
      id: 2,
      status: 'En curso',
      location: 'Barrio Santiago Norte',
    },
    {
      id: 3,
      status: 'Finalizada',
      location: 'Barrio Santiago Norte',
    },
  ];

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

    const getActionButtons = (status: string) => {
      if (status === 'Finalizada') {
        return (
          <View style={styles.routeActions}>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => navigation.navigate('RouteDetails', {ruta})}
            >
              <Text style={styles.detailsButtonText}>Ver detalles</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pdfButton}>
              <Text style={styles.pdfButtonText}>Imprimir PDF</Text>
            </TouchableOpacity>
          </View>
        );
      } else {
        return (
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => navigation.navigate('RouteDetails', {ruta})}
          >
            <Text style={styles.detailsButtonText}>Ver detalles</Text>
          </TouchableOpacity>
        );
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
          <Text style={styles.routeLocation}>{ruta.location}</Text>
        </View>

        {getActionButtons(ruta.status)}
      </View>
    );
  };

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

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
          style={styles.addRouteButton}
          onPress={() => navigation.navigate('RouteForm')}
          >
            <Text style={styles.addRouteButtonText}>Agregar ruta</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
          style={styles.manageRoutesButton}
          onPress={() => navigation.navigate('')} // Aqui va el de routeManagement
          >
            <Text style={styles.manageRoutesButtonText}>Administrar Rutas</Text>
          </TouchableOpacity>
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
    width: 12,
    height: 12,
    marginRight: 6,
  },
  routeLocation: {
    fontSize: 14,
    color: '#5C5C60',
  },
  routeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },
  detailsButton: {
    backgroundColor: '#5050FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  addRouteButton: {
    flex: 1,
    backgroundColor: '#5050FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  manageRoutesButton: {
    flex: 1,
    backgroundColor: '#5C5C60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageRoutesButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pdfButton: {
    backgroundColor: '#00953B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default Home;
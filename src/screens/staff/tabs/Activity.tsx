import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image
} from 'react-native';

const Activity = () => {
  const renderEmptyCard = () => (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>
            <Image
                source={require('../../../assets/act_off_icon.png')}
                style={styles.actIcon}
            />
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Actividad</Text>
        </View>

        {/* Rutas actuales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rutas actuales</Text>
          {renderEmptyCard()}
        </View>

        {/* Rutas recientes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rutas recientes</Text>
          {renderEmptyCard()}
          {renderEmptyCard()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'left',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5C5C60',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 40,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    minHeight: 120,
  },
  emptyIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconText: {
    fontSize: 24,
    opacity: 0.5,
  },
  actIcon: {
    width: 20,
    height: 20,
  }
});

export default Activity;
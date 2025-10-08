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

const Profile = () => {
  const renderServicesCard = () => (
    <View style={styles.servicesCard}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>📋</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header con avatar y configuraciones */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <View style={styles.avatarIcon}>
                <Text style={styles.avatarIconText}>
                  <Image
                    source={require('../../../assets/profile_off_icon.png')}
                  />
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>
              <Image
                source={require('../../../assets/conf_icon.png')}
                style={styles.confIcon}
              />
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sección Mis servicios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis servicios</Text>
          {renderServicesCard()}
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
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 30,
    paddingBottom: 30,
  },
  avatarContainer: {
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIconText: {
    fontSize: 20,
    opacity: 0.6,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  settingsIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'left',
  },
  servicesCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 40,
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
  confIcon: {
    width: 24,
    height: 24,
  },
});

export default Profile;
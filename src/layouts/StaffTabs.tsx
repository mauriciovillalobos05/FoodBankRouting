import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Profile from '../screens/staff/tabs/Profile';

const Tab = createBottomTabNavigator();

// Componentes temporales para las tabs que están vacías
function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Inicio</Text>
      <Text>Pantalla de inicio (temporal)</Text>
    </View>
  );
}

function ActivityScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Actividad</Text>
      <Text>Pantalla de actividad (temporal)</Text>
    </View>
  );
}

export default function StaffTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Activity" 
        component={ActivityScreen}
        options={{ title: 'Actividad' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
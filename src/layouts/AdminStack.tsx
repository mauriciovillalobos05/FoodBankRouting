import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, StyleSheet } from 'react-native';

import Dashboard from '../screens/admin/tabs/Dashboard';
import UsersManagement from '../screens/admin/tabs/UsersManagement';
import StaffManagement from '../screens/admin/admin_functions/staff_assign/StaffManagement';
import StaffRegisterEmail from '../screens/admin/admin_functions/staff_assign/StaffRegisterEmail';
import StaffRegisterDetails from '../screens/admin/admin_functions/staff_assign/StaffRegisterDetails';
import RouteForm from '../screens/admin/admin_functions/routes/RouteForm';
import RouteManagement from '../screens/admin/admin_functions/routes/RouteManagement';
import RouteDetails from '../screens/admin/admin_functions/routes/RouteDetails';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tab Navigator para las pantallas principales
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#5050FF',
        tabBarInactiveTintColor: '#5C5C60',
        tabBarStyle: styles.tabBar,
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Panel" 
        component={Dashboard}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused 
                ? require('../assets/home_on_icon.png')
                : require('../assets/home_off_icon.png')
              }
              style={styles.tabIcon}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Usuarios" 
        component={UsersManagement}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={focused 
                ? require('../assets/profile_on_icon.png')
                : require('../assets/profile_off_icon.png')
              }
              style={styles.tabIcon}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Stack Navigator principal que incluye Tabs y pantallas modales
export default function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tabs principales */}
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      
      {/* Pantallas de rutas */}
      <Stack.Screen name="RouteForm" component={RouteForm} />
      <Stack.Screen name="RouteManagement" component={RouteManagement} />
      <Stack.Screen name="RouteDetails" component={RouteDetails} />
      
      {/* Pantallas de staff (si las necesitas) */}
      <Stack.Screen name="StaffManagement" component={StaffManagement} />
      <Stack.Screen name="StaffRegisterEmail" component={StaffRegisterEmail} />
      <Stack.Screen name="StaffRegisterDetails" component={StaffRegisterDetails} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingBottom: 5,
    height: 60,
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
});
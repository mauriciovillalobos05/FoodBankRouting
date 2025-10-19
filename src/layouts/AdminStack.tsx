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

// Param list for the Admin stack so Screen names and params are type-safe
type AdminStackParamList = {
  AdminTabs: undefined;
  RouteForm: undefined;
  RouteManagement: undefined;
  RouteDetails: { routeId: string; routeName: string };
  StaffManagement: undefined;
  StaffRegisterEmail: undefined;
  StaffRegisterDetails: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<AdminStackParamList>();

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
        <Stack.Screen name="RouteForm">{(props) => <RouteForm {...(props as any)} />}</Stack.Screen>
        <Stack.Screen name="RouteManagement">{(props) => <RouteManagement {...(props as any)} />}</Stack.Screen>
        <Stack.Screen name="RouteDetails">{(props) => <RouteDetails {...(props as any)} />}</Stack.Screen>
            
        {/* Pantallas de staff (si las necesitas) */}
        <Stack.Screen name="StaffManagement">{(props) => <StaffManagement {...(props as any)} />}</Stack.Screen>
        <Stack.Screen name="StaffRegisterEmail">{(props) => <StaffRegisterEmail {...(props as any)} />}</Stack.Screen>
        <Stack.Screen name="StaffRegisterDetails">{(props) => <StaffRegisterDetails {...(props as any)} />}</Stack.Screen>
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
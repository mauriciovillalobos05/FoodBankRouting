// App.tsx
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import RootNavigator from './src/app/RootNavigator';
import SplashScreen from './src/components/ui/SplashScreen';

import Login from '@/screens/auth/Login';
import Profile from '@/screens/staff/tabs/Profile';
import Verify from '@/screens/auth/Verify';
import HomeAdmin from '@/screens/admin/admin_functions/staff_assign/HomeAdmin';
import Home from '@/screens/admin/tabs/Dashboard';
import UsuariosAdmin from '@/screens/admin/admin_functions/staff_assign/usuariosAdmin';
import StaffRegisterDetails from '@/screens/admin/admin_functions/staff_assign/StaffRegisterDetails';
import StaffManagement from '@/screens/admin/admin_functions/staff_assign/StaffManagement';
import RouteDetails from '@/screens/admin/admin_functions/routes/RouteDetails';
import RouteForm from '@/screens/admin/admin_functions/routes/RouteForm';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [Linking.createURL('/'), 'foodbank://'],
  config: {
    screens: {
      // landing por deep link: <scheme>://login
      Login: 'login',
      Register: 'register',
      AuthCallback: 'auth-callback',
      Profile: 'profile',
      // todo lo demás cae en Root (app post-login)
      Root: '*',
    },
  },
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          // arranca en Login como landing
          initialRouteName="Login"
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="Verify" component={Profile} />
          <Stack.Screen name="Root" component={RootNavigator} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="UsuariosAdmin" component={UsuariosAdmin} />
          <Stack.Screen name="StaffRegisterDetails" component={StaffRegisterDetails} />
          <Stack.Screen name="StaffManagement" component={StaffManagement} />
          <Stack.Screen name="RouteDetails" component={RouteDetails} />
          <Stack.Screen name="RouteForm" component={RouteForm} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import RootNavigator from './src/app/RootNavigator';
import SplashScreen from './src/components/ui/SplashScreen';

import Login from '@/screens/staff/auth/Login';
import Register from '@/screens/staff/auth/Register';
import Profile from '@/screens/staff/tabs/Profile';
import Verify from '@/screens/staff/auth/Verify';
import Confirmacion from '@/screens/staff/auth/OTP';
import { supabase } from './src/lib/supabaseClient';

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
      Confirmacion: 'otp',
      // todo lo demás cae en Root (app post-login)
      Root: '*',
    },
  },
};

// Navigation ref para permitir navegación fuera de componentes
export const navigationRef = createNavigationContainerRef();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleSplashFinish = () => {
    setIsLoading(false);
  };

  // Escuchar cambios de auth y navegar cuando exista sesión
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('onAuthStateChange', event, session);
      if (session?.user && navigationRef.isReady()) {
        // reemplaza el stack y navega a la app principal
        navigationRef.resetRoot({ index: 0, routes: [{ name: 'Root' }] });
      }
    });

    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  if (isLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          // arranca en Login como landing
          initialRouteName="Login"
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="Verify" component={Profile} />
          <Stack.Screen name="Root" component={RootNavigator} />
          <Stack.Screen name="Confirmacion" component={Confirmacion} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

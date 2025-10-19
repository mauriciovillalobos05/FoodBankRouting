import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import SplashScreen from './src/components/ui/SplashScreen';
import Login from '@/screens/auth/Login';
import Confirmacion from '@/screens/auth/OTP';
import Verify from '@/screens/auth/Verify';
import Profile from '@/screens/staff/tabs/Profile';
import RootNavigator from './src/app/RootNavigator';

import { AuthProvider } from '@/services/AuthContext';
import { performInitialSecurityCheck, startTamperingMonitoring } from './src/services/antiTampering';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [Linking.createURL('/'), 'foodbank://'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      AuthCallback: 'auth-callback',
      Profile: 'profile',
      Confirmacion: 'otp',
      Root: '*',
    },
  },
};

function TamperDetectedScreen({ onForceQuit }: { onForceQuit: () => void }) {
  return (
    <View style={styles.blockContainer}>
      <Text style={styles.blockTitle}>⚠️ Seguridad comprometida</Text>
      <Text style={styles.blockText}>
        Detectamos modificaciones o un entorno no seguro en este dispositivo. Por seguridad la aplicación ha sido bloqueada.
      </Text>
      <TouchableOpacity style={styles.blockButton} onPress={onForceQuit}>
        <Text style={styles.blockButtonText}>Salir / Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const monitoringRef = useRef<ReturnType<typeof startTamperingMonitoring> | null>(null);

  const handleSplashFinish = async () => {
    try {
      const passed = await performInitialSecurityCheck();
      if (!passed) {
        setIsBlocked(true);
        setIsLoading(false);
        return;
      }
      monitoringRef.current = startTamperingMonitoring();
      setIsLoading(false);
    } catch (e) {
      console.error('Error in initial security check:', e);
      setIsBlocked(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (monitoringRef.current) clearInterval(monitoringRef.current as unknown as number);
    };
  }, []);

  const handleForceQuitOrSignOut = () => {
    Alert.alert(
      'Aplicación bloqueada',
      'La aplicación será cerrada por seguridad.',
      [{ text: 'Cerrar sesión y salir', onPress: () => Platform.OS === 'android' && BackHandler.exitApp() }],
      { cancelable: false }
    );
  };

  if (isLoading) return <SplashScreen onFinish={handleSplashFinish} />;
  if (isBlocked) return <TamperDetectedScreen onForceQuit={handleForceQuitOrSignOut} />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer linking={linking}>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Verify" component={Verify} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Root" component={RootNavigator} />
            <Stack.Screen name="Confirmacion" component={Confirmacion} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  blockContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  blockTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  blockText: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  blockButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, backgroundColor: '#e53935' },
  blockButtonText: { color: '#fff', fontWeight: '600' },
});
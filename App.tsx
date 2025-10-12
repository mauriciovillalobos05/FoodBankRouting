// App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import RootNavigator from './src/app/RootNavigator';
import SplashScreen from './src/components/ui/SplashScreen';

import Login from '@/screens/staff/auth/Login';
import Register from '@/screens/staff/auth/Register';
import Profile from '@/screens/staff/tabs/Profile';
import Verify from '@/screens/staff/auth/Verify';

import {
  performInitialSecurityCheck,
  startTamperingMonitoring,
} from './src/services/antiTampering';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [Linking.createURL('/'), 'foodbank://'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      AuthCallback: 'auth-callback',
      Profile: 'profile',
      Root: '*',
    },
  },
};

/*
 Simple full-screen component shown when tampering is detected.
*/
function TamperDetectedScreen({ onForceQuit }: { onForceQuit: () => void }) {
  return (
    <View style={styles.blockContainer}>
      <Text style={styles.blockTitle}>⚠️ Seguridad comprometida</Text>
      <Text style={styles.blockText}>
        Detectamos modificaciones o un entorno no seguro en este dispositivo. Por
        seguridad la aplicación ha sido bloqueada.
      </Text>

      <TouchableOpacity style={styles.blockButton} onPress={onForceQuit}>
        <Text style={styles.blockButtonText}>Salir / Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  // show splash while loading and running initial security checks
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const monitoringRef = useRef<ReturnType<typeof startTamperingMonitoring> | null>(null);

  // handle events that should happen when splash finishes
  const handleSplashFinish = async () => {
    // Run the initial security check. This will:
    // - return true when checks passed (or in DEV mode)
    // - return false when tampering detected (the antiTampering module will take actions such as signOut)
    try {
      const passed = await performInitialSecurityCheck();

      if (!passed) {
        // Block UI and avoid showing rest of the app
        setIsBlocked(true);
        setIsLoading(false); // stop showing the splash and show blocked screen
        return;
      }

      // Start continuous monitoring (returns interval id)
      const interval = startTamperingMonitoring(/* default 30s or pass desired ms */);
      monitoringRef.current = interval;

      setIsLoading(false);
    } catch (error) {
      console.error('Error running initial security check', error);
      // If the check itself fails unexpectedly, fail safe: block access
      setIsBlocked(true);
      setIsLoading(false);
    }
  };

  // cleanup monitoring interval on unmount
  useEffect(() => {
    return () => {
      try {
        if (monitoringRef.current) {
          clearInterval(monitoringRef.current as unknown as number);
          monitoringRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // when blocked, provide handler to force quit or navigate to login
  const handleForceQuitOrSignOut = () => {
    // If you implemented NativeModules.AppModule.exitApp() in native module, call it here.
    // For now, try to navigate to Login and then exit if possible.
    Alert.alert(
      'Aplicación bloqueada',
      'La aplicación será cerrada por seguridad. Puedes reinstalarla o usar otro dispositivo.',
      [
        {
          text: 'Cerrar sesión y salir',
          onPress: () => {
            // Try to exit on android
            if (Platform.OS === 'android') {
              BackHandler.exitApp();
            } else {
              // Navigation is not available here, so just show alert or handle as needed for iOS.
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (isLoading) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (isBlocked) {
    return <TamperDetectedScreen onForceQuit={handleForceQuitOrSignOut} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Login"
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen name="Verify" component={Profile} />
          <Stack.Screen name="Root" component={RootNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  blockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  blockTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  blockText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  blockButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#e53935',
  },
  blockButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

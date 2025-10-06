// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import RootNavigator from './src/app/RootNavigator';
// Opción A (ejemplo): ./src/app/auth/login
// import Login from './src/app/auth/login';
// Opción B (ejemplo): ./src/app/login
import Login from '@/screens/volunteer/auth/Login';
import Register from '@/screens/volunteer/auth/Register';
import Profile from '@/screens/volunteer/tabs/Profile';
import Verify from '@/screens/volunteer/auth/Verify';
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
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

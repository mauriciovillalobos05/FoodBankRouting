import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StaffTabs from '../layouts/StaffTabs';
import AdminStack from '../layouts/AdminStack';
import Login from '../screens/auth/Login';
import Verify from '../screens/auth/Verify';
import Profile from '../screens/staff/tabs/Profile';
import { useAuth } from '../features/auth/useAuth';
import { useRole } from '../features/auth/useRole';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

type RootStackParamList = {
  Auth: undefined;
  Staff: undefined;
  Admin: undefined;
  Profile: undefined;
};

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Verify: { email?: string; phone?: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="Verify" component={Verify} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator() {
  const DEV_MODE = true;

  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();

  if (authLoading || (user && roleLoading)) return <LoadingScreen />;

  if (DEV_MODE) {
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Admin" component={AdminStack} />
      </RootStack.Navigator>
    );
  }
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          {role === 'admin' ? (
            <RootStack.Screen name="Admin" component={AdminStack} />
          ) : (
            <RootStack.Screen name="Staff" component={StaffTabs} />
          )}
          <RootStack.Screen name="Profile" component={Profile} />
        </>
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
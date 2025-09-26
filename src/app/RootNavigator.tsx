import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VolunteerTabs from '../layouts/VolunteerTabs';
import StaffStack from '../layouts/StaffStack';
import Login from '../screens/volunteer/auth/Login';
import Register from '../screens/volunteer/auth/Register';
import Verify from '../screens/volunteer/auth/Verify';
import Profile from '../screens/volunteer/tabs/Profile';
import { useAuth } from '../features/auth/useAuth';
import { useRole } from '../features/auth/useRole';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

type RootStackParamList = {
  Auth: undefined;
  Volunteer: undefined;
  Staff: undefined;
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
      <AuthStack.Screen name="Register" component={Register} />
      <AuthStack.Screen name="Verify" component={Verify} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();

  if (authLoading || (user && roleLoading)) return <LoadingScreen />;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          {role === 'staff' ? (
            <RootStack.Screen name="Staff" component={StaffStack} />
          ) : (
            <RootStack.Screen name="Volunteer" component={VolunteerTabs} />
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
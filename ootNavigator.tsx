// src/app/RootNavigator.tsx
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@/services/AuthContext';

// Admin screens
import Home from '@/screens/admin/tabs/Dashboard';
import UsuariosAdmin from '@/screens/admin/admin_functions/staff_assign/usuariosAdmin';
import StaffRegisterDetails from '@/screens/admin/admin_functions/staff_assign/StaffRegisterDetails';
import RouteDetails from '@/screens/admin/admin_functions/routes/RouteDetails';
import RouteForm from '@/screens/admin/admin_functions/routes/RouteForm';
import RouteManagement from '@/screens/admin/admin_functions/routes/RouteManagement';

// Staff screens
import Profile from '@/screens/staff/tabs/Profile';

console.log('📁 RootNavigator.tsx CARGADO');

// Define los tipos unificados para AdminStack
export type AdminStackParamList = {
  AdminHome: undefined;
  Home: undefined;
  UsuariosAdmin: undefined;
  UsersMain: undefined;
  StaffRegisterDetails: { selectedStaffId: string };
  StaffManagement: {
    id?: string;
    location?: string;
    status?: 'Pendiente' | 'En curso' | 'Finalizada';
    participant_id?: string
  } | undefined;
  RouteDetails: { routeId: string; routeName: string };
  RouteForm: undefined;
  RouteManagement: {
    id?: string;
    location?: string;
    status?: 'Pendiente' | 'En curso' | 'Finalizada';
    participant_id?: string
  } | undefined;
};

// Define los tipos para StaffStack
export type StaffStackParamList = {
  StaffHome: undefined;
  Profile: undefined;
};

const AdminStack = createNativeStackNavigator<AdminStackParamList>();
const StaffStack = createNativeStackNavigator<StaffStackParamList>();

// Navigator para Admin con sus pantallas específicas
function AdminNavigator() {
  console.log('🎨 Renderizando AdminNavigator');
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminHome" component={Home} />
      <AdminStack.Screen name="Home" component={Home} />
      <AdminStack.Screen name="UsuariosAdmin" component={UsuariosAdmin} />
      <AdminStack.Screen name="UsersMain" component={UsuariosAdmin} />
      <AdminStack.Screen name="StaffRegisterDetails" component={StaffRegisterDetails} />
      <AdminStack.Screen name="RouteDetails" component={RouteDetails} />
      <AdminStack.Screen name="RouteForm" component={RouteForm} />
      <AdminStack.Screen name="RouteManagement" component={RouteManagement} />
    </AdminStack.Navigator>
  );
}

// Navigator para Staff con sus pantallas específicas
function StaffNavigator() {
  console.log('👤 Renderizando StaffNavigator');
  return (
    <StaffStack.Navigator screenOptions={{ headerShown: false }}>
      <StaffStack.Screen name="Profile" component={Profile} />
    </StaffStack.Navigator>
  );
}

export default function RootNavigator() {
  console.log('🚀 RootNavigator component mounted');
  
  // ✅ USAR AuthContext en lugar de AsyncStorage
  const { role, loading } = useAuth();

  console.log('🔍 RootNavigator - Role from context:', role);
  console.log('🔍 RootNavigator - Loading:', loading);

  if (loading) {
    console.log('⏳ RootNavigator - Mostrando loading...');
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#F5F5F5' 
      }}>
        <ActivityIndicator size="large" color="#5050FF" />
        <Text style={{ marginTop: 16, color: '#666' }}>
          Cargando perfil...
        </Text>
      </View>
    );
  }

  console.log('🎯 RootNavigator - Decidiendo navigator. Role:', role);

  if (role === 'admin') {
    console.log('✅ Navegando a AdminNavigator');
    return <AdminNavigator />;
  }

  console.log('✅ Navegando a StaffNavigator (default)');
  return <StaffNavigator />;
}
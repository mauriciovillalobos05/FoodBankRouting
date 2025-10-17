import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Profile from '../screens/staff/tabs/Profile';
import Home from '../screens/staff/tabs/Home';
import Activity from '../screens/staff/tabs/Activity';
import RouteConfirm from '../screens/staff/routes/RouteConfirm';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

// Función para renderizar los iconos de las tabs
const TabIcon = ({ focused, iconName }: { focused: boolean; iconName: string }) => {
  const getIconSource = () => {
    switch (iconName) {
      case 'home':
        return focused 
          ? require('../assets/home_on_icon.png')
          : require('../assets/home_off_icon.png');
      case 'activity':
        return focused 
          ? require('../assets/act_on_icon.png')
          : require('../assets/act_off_icon.png');
      case 'profile':
        return focused 
          ? require('../assets/profile_on_icon.png')
          : require('../assets/profile_off_icon.png');
      default:
        return require('../assets/home_off_icon.png');
    }
  };

  return (
    <Image 
      source={getIconSource()} 
      style={styles.tabIcon}
      resizeMode="contain"
    />
  );
};

export default function StaffTabs() {
  function HomeStackNavigator() {
    return (
      <HomeStack.Navigator screenOptions={{ headerShown: false }}>
        <HomeStack.Screen name="HomeMain" component={Home} />
        <HomeStack.Screen name="Profile" component={Profile} />
        <HomeStack.Screen name="RouteConfirm" component={RouteConfirm} />
      </HomeStack.Navigator>
    );
  }
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#CE0E2D',
        tabBarInactiveTintColor: '#5C5C60',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{ 
          title: 'Panel',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="home" />
          ),
        }}
      />
      <Tab.Screen 
        name="Activity" 
        component={Activity}
        options={{ 
          title: 'Actividad',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="activity" />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile}
        options={{ 
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} iconName="profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
  },
});
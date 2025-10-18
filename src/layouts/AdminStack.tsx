import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, StyleSheet } from 'react-native';

import Dashboard from '../screens/admin/tabs/Dashboard';
import UsersManagement from '../screens/admin/tabs/UsersManagement';
import StaffManagement from '../screens/admin/admin_functions/staff_assign/StaffManagement';
import StaffRegisterEmail from '../screens/admin/admin_functions/staff_assign/StaffRegisterEmail';
import StaffRegisterDetails from '../screens/admin/admin_functions/staff_assign/StaffRegisterDetails';
import RouteManagement from '@/screens/admin/admin_functions/routes/RouteManagement';

const Tab = createBottomTabNavigator();
const UserStack = createNativeStackNavigator();

function UsersStackNavigator() {
  return (
    <UserStack.Navigator screenOptions={{ headerShown: false }}>
      <UserStack.Screen name="UsersMain" component={UsersManagement} />
      <UserStack.Screen name="RouteManagement" component={RouteManagement} />
      <UserStack.Screen name="StaffRegisterEmail" component={StaffRegisterEmail} />
      <UserStack.Screen name="StaffRegisterDetails" component={StaffRegisterDetails} />
    </UserStack.Navigator>
  );
}

export default function AdminStack(){
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
                component={UsersStackNavigator}
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
    )
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

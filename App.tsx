// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import RootNavigator from './src/app/RootNavigator';
import AuthCallback, { RootStackParamList } from '@/screens/volunteer/routes/AuthCallback';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [Linking.createURL('/'), 'foodbank://'],
  config: {
    screens: {
      AuthCallback: 'auth-callback',
      Root: '*', // tu contenedor principal
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Root"              // arranca en Root
        >
          <Stack.Screen name="Root" component={RootNavigator} />
          <Stack.Screen name="AuthCallback" component={AuthCallback} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

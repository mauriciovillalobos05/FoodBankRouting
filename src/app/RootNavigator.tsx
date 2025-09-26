import { createNativeStackNavigator } from '@react-navigation/native-stack'
import VolunteerTabs from '../layouts/VolunteerTabs'
import StaffStack from '../layouts/StaffStack'
import Login from '../screens/volunteer/auth/Login'
import Register from '../screens/volunteer/auth/Register'
import Verify from '../screens/volunteer/auth/Verify'
import { useAuth } from '../features/auth/useAuth'
import { useRole } from '../features/auth/useRole'
import { ActivityIndicator, View, StyleSheet } from 'react-native'

type RootStackParamList = {
  Auth: undefined
  Volunteer: undefined
  Staff: undefined
}

type AuthStackParamList = {
  Login: undefined
  Register: undefined
  Verify: { email?: string; phone?: string }
}

const Root = createNativeStackNavigator<RootStackParamList>()
const Auth = createNativeStackNavigator<AuthStackParamList>()

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  )
}

function AuthStack() {
  return (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
      <Auth.Screen name="Login" component={Login} />
      <Auth.Screen name="Register" component={Register} />
      <Auth.Screen name="Verify" component={Verify} />
    </Auth.Navigator>
  )
}

export default function RootNavigator() {
  const { user, loading } = useAuth()
  const { role } = useRole()

  if (loading) return <LoadingScreen />

  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Root.Screen name="Auth" component={AuthStack} />
      ) : role === 'staff' ? (
        <Root.Screen name="Staff" component={StaffStack} />
      ) : (
        <Root.Screen name="Volunteer" component={VolunteerTabs} />
      )}
    </Root.Navigator>
  )
}

const styles = StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
    });

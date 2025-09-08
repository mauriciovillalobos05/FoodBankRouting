import { createNativeStackNavigator } from '@react-navigation/native-stack'
import VolunteerTabs from '../layouts/VolunteerTabs'
import StaffStack from '../layouts/StaffStack'
import Login from '../screens/volunteer/auth/Login'
import { useAuth } from '../features/auth/useAuth'
import { useRole } from '../features/auth/useRole'

type RootStackParamList = {
  Auth: undefined
  Volunteer: undefined
  Staff: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  const { user, loading } = useAuth()
  const { role } = useRole()

  if (loading) return null 

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={Login} />
      ) : role === 'staff' ? (
        <Stack.Screen name="Staff" component={StaffStack} />
      ) : (
        <Stack.Screen name="Volunteer" component={VolunteerTabs} />
      )}
    </Stack.Navigator>
  )
}

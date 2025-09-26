import 'dotenv/config'
import { ExpoConfig } from 'expo/config'

export default (): ExpoConfig => ({
  name: 'app-movil',
  slug: 'app-movil',
  scheme: 'foodbank',
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
})

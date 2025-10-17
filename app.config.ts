import { supabase } from '@/services/supabase'
import 'dotenv/config'
import { ExpoConfig } from 'expo/config'

export default (): ExpoConfig => ({
  name: 'app-movil',
  slug: 'app-movil',
  scheme: 'foodbank',
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseServiceRoleKey: process.env.EXPO_SUPABASE_SERVICE_ROLE_KEY,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
})

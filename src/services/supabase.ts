import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hybrid Secure Storage Adapter
 * - Stores access_token and refresh_token in SecureStore (Keychain/Keystore)
 * - Stores larger session data in AsyncStorage with encrypted tokens removed
 * This approach keeps sensitive tokens secure while handling large session objects
 */
const HybridSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      const sessionData = await AsyncStorage.getItem(key);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      const accessToken = await SecureStore.getItemAsync(`${key}_access_token`);
      const refreshToken = await SecureStore.getItemAsync(`${key}_refresh_token`);

      if (accessToken) session.access_token = accessToken;
      if (refreshToken) session.refresh_token = refreshToken;

      return JSON.stringify(session);
    } catch (error) {
      console.error('Error reading from hybrid storage', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (!value) {
        console.error('[ADAPTER] setItem received a null or empty value. Aborting.');
        return;
      }

      const session = JSON.parse(value);
      if (typeof session !== 'object' || session === null) {
        console.error('[ADAPTER] Parsed session is not a valid object. Aborting.', session);
        return;
      }

      // Extract and store tokens securely in SecureStore
      if (session.access_token) {
        await SecureStore.setItemAsync(
          `${key}_access_token`,
          session.access_token
        );
      }
      if (session.refresh_token) {
        await SecureStore.setItemAsync(
          `${key}_refresh_token`,
          session.refresh_token
        );
      }

      // Remove tokens from the session object for AsyncStorage
      const sessionWithoutTokens = { ...session };
      delete sessionWithoutTokens.access_token;
      delete sessionWithoutTokens.refresh_token;

      // Store the rest in AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify(sessionWithoutTokens));
    } catch (error) {
      console.error('!!!!!!!! [ADAPTER] CRITICAL ERROR in setItem !!!!!!!!', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      await SecureStore.deleteItemAsync(`${key}_access_token`);
      await SecureStore.deleteItemAsync(`${key}_refresh_token`);
    } catch (error) {
      console.error('Error removing from hybrid storage', error);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: HybridSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
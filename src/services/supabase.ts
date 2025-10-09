// services/supabase.ts
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
      // Try to get the full session from AsyncStorage
      const sessionData = await AsyncStorage.getItem(key);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

      // Retrieve the secure tokens from SecureStore
      const accessToken = await SecureStore.getItemAsync(`${key}_access_token`);
      const refreshToken = await SecureStore.getItemAsync(`${key}_refresh_token`);

      // Reconstruct the session with secure tokens
      if (accessToken) {
        session.access_token = accessToken;
      }
      if (refreshToken) {
        session.refresh_token = refreshToken;
      }

      return JSON.stringify(session);
    } catch (error) {
      console.error('Error reading from hybrid storage');
      return null;
    }
  },

  setItem: async (key: string, value: string) => {
    try {
      const session = JSON.parse(value);

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

      // Remove tokens from the session object
      const sessionWithoutTokens = { ...session };
      delete sessionWithoutTokens.access_token;
      delete sessionWithoutTokens.refresh_token;

      // Store the rest in AsyncStorage (no sensitive data)
      await AsyncStorage.setItem(key, JSON.stringify(sessionWithoutTokens));
    } catch (error) {
      console.error('Error writing to hybrid storage');
    }
  },

  removeItem: async (key: string) => {
    try {
      // Remove from both storages
      await AsyncStorage.removeItem(key);
      await SecureStore.deleteItemAsync(`${key}_access_token`);
      await SecureStore.deleteItemAsync(`${key}_refresh_token`);
    } catch (error) {
      console.error('Error removing from hybrid storage');
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

// Helper function to safely log errors without exposing sensitive data
export const safeLogError = (context: string, error: any) => {
  // Only log in development, and sanitize the error
  if (__DEV__) {
    const sanitizedError = {
      context,
      message: error?.message || 'Unknown error',
      // Don't log error.details or full error object
    };
    console.error('App Error:', sanitizedError);
  }
};
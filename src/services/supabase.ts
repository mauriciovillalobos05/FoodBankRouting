// services/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validatePinningConfig, logPinningFailure } from './sslPinning';

/**
 * Hybrid Secure Storage Adapter
 * - Stores access_token and refresh_token in SecureStore (Keychain/Keystore)
 * - Stores larger session data in AsyncStorage with encrypted tokens removed
 */
const HybridSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      const sessionData = await AsyncStorage.getItem(key);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);

      const accessToken = await SecureStore.getItemAsync(`${key}_access_token`);
      const refreshToken = await SecureStore.getItemAsync(`${key}_refresh_token`);

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

      const sessionWithoutTokens = { ...session };
      delete sessionWithoutTokens.access_token;
      delete sessionWithoutTokens.refresh_token;

      await AsyncStorage.setItem(key, JSON.stringify(sessionWithoutTokens));
    } catch (error) {
      console.error('Error writing to hybrid storage');
    }
  },

  removeItem: async (key: string) => {
    try {
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

// Validate SSL pinning configuration
if (__DEV__) {
  validatePinningConfig();
}

/**
 * Custom fetch with certificate pinning validation
 * Note: Actual pinning is handled at native level (see app.json config)
 */
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    const response = await fetch(input, init);
    
    return response;
  } catch (error: any) {
    // Check if it's a certificate error
    if (
      error.message?.includes('certificate') ||
      error.message?.includes('SSL') ||
      error.message?.includes('TLS')
    ) {
      logPinningFailure(error, typeof input === 'string' ? input.toString() : 'unknown');
    }
    throw error;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: HybridSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch,
  },
});

/**
 * Helper function to safely log errors without exposing sensitive data
 */
export const safeLogError = (context: string, error: any) => {
  if (__DEV__) {
    const sanitizedError = {
      context,
      message: error?.message || 'Unknown error',
    };
    console.error('App Error:', sanitizedError);
  }
};
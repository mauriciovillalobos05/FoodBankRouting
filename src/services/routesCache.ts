// services/routesCache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptPII, decryptPII } from './secureEncryption';

export interface Route {
  id: string;
  name: string;
  description?: string;
  route_date: string;
  start_time?: string;
  end_time?: string;
}

interface RouteWithStatus extends Route {
  status: 'Pendiente' | 'En curso' | 'Finalizada';
  participant_id?: string;
}

interface RoutesCacheData {
  routes: RouteWithStatus[];
  stats: {
    totalRutasHoy: number;
    rutasCompletadas: number;
    rutasSinFinalizar: number;
  };
  timestamp: number;
}

interface ActivityCacheData {
  currentRoutes: Route[];
  recentRoutes: Route[];
  timestamp: number;
}

const ROUTES_CACHE_KEY = 'encrypted_routes_cache';
const ACTIVITY_CACHE_KEY = 'encrypted_activity_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Cache routes data from Home screen (encrypted)
 */
export async function cacheRoutesData(data: RoutesCacheData): Promise<void> {
  try {
    const cacheData = {
      ...data,
      timestamp: Date.now(),
    };
    const jsonData = JSON.stringify(cacheData);
    const encrypted = await encryptPII(jsonData);
    await AsyncStorage.setItem(ROUTES_CACHE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to cache routes data');
  }
}

/**
 * Get cached routes data (decrypted)
 */
export async function getCachedRoutesData(): Promise<RoutesCacheData | null> {
  try {
    const encrypted = await AsyncStorage.getItem(ROUTES_CACHE_KEY);
    if (!encrypted) return null;

    const decrypted = await decryptPII(encrypted);
    const data: RoutesCacheData = JSON.parse(decrypted);

    // Check if cache is still valid
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      await AsyncStorage.removeItem(ROUTES_CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to retrieve cached routes');
    return null;
  }
}

/**
 * Cache activity data (encrypted)
 */
export async function cacheActivityData(data: ActivityCacheData): Promise<void> {
  try {
    const cacheData = {
      ...data,
      timestamp: Date.now(),
    };
    const jsonData = JSON.stringify(cacheData);
    const encrypted = await encryptPII(jsonData);
    await AsyncStorage.setItem(ACTIVITY_CACHE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to cache activity data');
  }
}

/**
 * Get cached activity data (decrypted)
 */
export async function getCachedActivityData(): Promise<ActivityCacheData | null> {
  try {
    const encrypted = await AsyncStorage.getItem(ACTIVITY_CACHE_KEY);
    if (!encrypted) return null;

    const decrypted = await decryptPII(encrypted);
    const data: ActivityCacheData = JSON.parse(decrypted);

    // Check if cache is still valid
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      await AsyncStorage.removeItem(ACTIVITY_CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to retrieve cached activity');
    return null;
  }
}

/**
 * Clear all routes cache
 */
export async function clearRoutesCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([ROUTES_CACHE_KEY, ACTIVITY_CACHE_KEY]);
  } catch (error) {
    console.error('Failed to clear routes cache');
  }
}
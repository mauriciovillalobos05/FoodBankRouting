// services/userCache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptPII, decryptPII } from './secureEncryption';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
}

const CACHE_KEY = 'user_profile_encrypted';

export async function cacheUserProfile(profile: UserProfile): Promise<void> {
  try {
    const jsonData = JSON.stringify(profile);
    const encrypted = await encryptPII(jsonData);
    await AsyncStorage.setItem(CACHE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to cache user profile');
  }
}

export async function getCachedUserProfile(): Promise<UserProfile | null> {
  try {
    const encrypted = await AsyncStorage.getItem(CACHE_KEY);
    if (!encrypted) return null;
    
    const decrypted = await decryptPII(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to retrieve cached profile');
    return null;
  }
}

export async function clearUserCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}
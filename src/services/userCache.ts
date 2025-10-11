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
    console.error('[USER_CACHE] ❌ Failed to cache user profile:', error);
  }
}

export async function getCachedUserProfile(): Promise<UserProfile | null> {
  try {
    
    const encrypted = await AsyncStorage.getItem(CACHE_KEY);
    
    if (!encrypted) {
      console.log('[USER_CACHE] ℹ️ No cached profile found');
      return null;
    }
    
    const decrypted = await decryptPII(encrypted);
    const profile: UserProfile = JSON.parse(decrypted);
    
    return profile;
  } catch (error) {
    console.error('[USER_CACHE] ❌ Failed to retrieve cached profile:', error);
    return null;
  }
}

export async function clearUserCache(): Promise<void> {
  try {
    
    await AsyncStorage.removeItem(CACHE_KEY);
    
  } catch (error) {
    console.error('[USER_CACHE] ❌ Failed to clear user cache:', error);
  }
}
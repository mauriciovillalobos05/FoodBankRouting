// services/sslPinning.ts
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_DOMAIN = SUPABASE_URL.replace('https://', '').replace('http://', '');


export const CERTIFICATE_PINS = {
  supabase: [
    'sha256/o7y2J41zMtHgAsZJDXeU13tHTo2m4Br+9xBR8RdSCvY=', 
    'sha256/o7y2J41zMtHgAsZJDXeU13tHTo2m4Br+9xBR8RdSCvY=', 
  ],
};

/**
 * Pinning configuration for Android (using OkHttp)
 */
export const androidPinningConfig = {
  [SUPABASE_DOMAIN]: {
    includeSubdomains: true,
    pins: CERTIFICATE_PINS.supabase,
  },
};

/**
 * Pinning configuration for iOS
 */
export const iosPinningConfig = {
  [SUPABASE_DOMAIN]: {
    includeSubdomains: true,
    publicKeyHashes: CERTIFICATE_PINS.supabase,
  },
};

/**
 * Log certificate pinning failures
 */
export function logPinningFailure(error: any, url: string) {
  if (__DEV__) {
    console.error('🔒 Certificate Pinning Failure:', {
      url,
      platform: Platform.OS,
      errorType: 'CERTIFICATE_MISMATCH',
      timestamp: new Date().toISOString(),
    });
  }
  

}

/**
 * Validate that pinning is properly configured
 */
export function validatePinningConfig(): boolean {
  const hasValidPins = CERTIFICATE_PINS.supabase.every(
    pin => pin.length > 20 && pin.startsWith('sha256/')
  );
  
  if (!hasValidPins && __DEV__) {
    console.warn('⚠️ Certificate pins not configured! Please add your Supabase certificate pins.');
    return false;
  }
  
  return hasValidPins;
}


export const PINNING_SETUP_INSTRUCTIONS = `
`;

if (__DEV__ && !validatePinningConfig()) {
  console.log(PINNING_SETUP_INSTRUCTIONS);
}
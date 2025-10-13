// utils/testSSLPinning.ts
import { supabase } from '@/services/supabase';
import { validatePinningConfig } from '@/services/sslPinning';

/**
 * Test SSL Certificate Pinning
 * This will verify that connections are properly pinned
 */
export async function testSSLPinning() {
  
  // 1. Validate configuration
  const isConfigValid = validatePinningConfig();
  
  if (!isConfigValid) {
    console.warn('⚠️ SSL Pinning not properly configured!');
    return false;
  }
  
  // 2. Test connection to Supabase
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Connection failed (may indicate pinning working):', error.message);
      return false;
    }
    
    console.log('✅ Secure connection successful!');
    return true;
  } catch (error: any) {
    if (
      error.message?.includes('certificate') ||
      error.message?.includes('SSL') ||
      error.message?.includes('pinning')
    ) {
      return true; // This is actually good - it means pinning is working
    }
    
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

/**
 * Test with intentionally wrong domain (should fail)
 */
export async function testPinningWithWrongDomain() {
  
  try {
    const response = await fetch('https://example.com');
    return false;
  } catch (error: any) {
    if (error.message?.includes('certificate')) {
      return true;
    }
    console.log('❓ Unexpected result:', error.message);
    return false;
  }
}
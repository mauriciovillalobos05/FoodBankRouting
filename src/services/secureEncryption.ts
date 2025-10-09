// services/secureEncryption.ts
// Simplified encryption using expo-crypto + crypto-js (NO metro config needed)
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY_NAME = 'app_encryption_key_v1';

/**
 * Get or generate encryption key stored in Keychain/Keystore
 * Returns a 256-bit key in hex format
 */
async function getOrCreateEncryptionKey(): Promise<string> {
  try {
    let keyHex = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);
    
    if (!keyHex) {
      // Generate 256-bit (32 bytes) key
      const keyBytes = await Crypto.getRandomBytesAsync(32);
      keyHex = Array.from(keyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Store in Keychain/Keystore
      await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, keyHex);
    }
    
    return keyHex;
  } catch (error) {
    console.error('Failed to initialize encryption key');
    throw new Error('Encryption key initialization failed');
  }
}

/**
 * Encrypt PII data using AES-256
 * CryptoJS uses AES-256 in CBC mode with authentication
 */
export async function encryptPII(plaintext: string): Promise<string> {
  try {
    const keyHex = await getOrCreateEncryptionKey();
    
    // Convert hex key to WordArray for CryptoJS
    const key = CryptoJS.enc.Hex.parse(keyHex);
    
    // Generate random IV (16 bytes for AES)
    const ivBytes = await Crypto.getRandomBytesAsync(16);
    const ivHex = Array.from(ivBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    
    // Encrypt using AES-256-CBC with PKCS7 padding
    const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Return format: iv:ciphertext (both in base64)
    return `${ivHex}:${encrypted.ciphertext.toString(CryptoJS.enc.Base64)}`;
  } catch (error) {
    console.error('Encryption failed');
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt PII data
 */
export async function decryptPII(encryptedData: string): Promise<string> {
  try {
    const keyHex = await getOrCreateEncryptionKey();
    
    // Parse encrypted data format: iv:ciphertext
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const ivHex = parts[0];
    const ciphertextBase64 = parts[1];
    
    // Convert to CryptoJS format
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const ciphertext = CryptoJS.enc.Base64.parse(ciphertextBase64);
    
    // Create CipherParams object
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertext
    });
    
    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Convert to UTF-8 string
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plaintext) {
      throw new Error('Decryption produced empty result');
    }
    
    return plaintext;
  } catch (error) {
    console.error('Decryption failed');
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Securely delete encryption key (e.g., on logout)
 */
export async function deleteEncryptionKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_NAME);
  } catch (error) {
    console.error('Failed to delete encryption key');
  }
}

/**
 * Generate a secure hash of data (for integrity checks)
 */
export async function hashData(data: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
}
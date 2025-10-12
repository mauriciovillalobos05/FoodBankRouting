import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { ExpoConfig } from 'expo/config';

export default (): ExpoConfig => {
  // Resolve asset paths relative to project root
  const assetsDir = path.resolve(__dirname, 'assets');
  const adaptiveIconPath = path.join(assetsDir, 'adaptive-icon.png');
  const iconPath = path.join(assetsDir, 'icon.png');

  // Choose adaptive foreground image if available, otherwise fall back to icon.png
  const adaptiveForeground = fs.existsSync(adaptiveIconPath)
    ? './assets/adaptive-icon.png'
    : (fs.existsSync(iconPath) ? './assets/icon.png' : undefined);

  return {
    name: 'app-movil',
    slug: 'app-movil',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'foodbank',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.foodbank.appmovil',
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSExceptionDomains: {
            'ahhshjqbceckysgrhkmx.supabase.co': {
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSExceptionRequiresForwardSecrecy: true,
              NSExceptionMinimumTLSVersion: 'TLSv1.2',
              NSIncludesSubdomains: true,
              NSRequiresCertificateTransparency: false
            }
          }
        }
      }
    },
    android: {
      // Only include adaptiveIcon.foregroundImage if we found a file
      adaptiveIcon: adaptiveForeground ? {
        foregroundImage: adaptiveForeground,
        backgroundColor: '#ffffff'
      } : undefined,
      package: 'com.foodbank.appmovil',
      permissions: ['INTERNET']
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      'expo-secure-store',
      [
        'expo-build-properties',
        {
          android: {
            // Disable cleartext traffic (force HTTPS)
            usesCleartextTraffic: false,
            // NOTE: `deploymentTarget` is an iOS concept; if you intended to set Android minSdkVersion or compileSdkVersion,
            // set those via the expo-build-properties plugin options instead.
            deploymentTarget: '13.0'
          }
        }
      ]
    ]
  };
};

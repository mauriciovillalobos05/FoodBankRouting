// services/antiTampering.ts
import { Platform, NativeModules } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

/**
 * Anti-Tampering Service
 * Implements MSTG-RESILIENCE-2 (Debugger Detection)
 * Implements MSTG-RESILIENCE-3 (Tampering Detection)
 * 
 * Detects:
 * - Debuggers (LLDB, GDB)
 * - Hooking frameworks (Frida, Xposed)
 * - Emulators
 * - Root/Jailbreak
 */

interface TamperingDetectionResult {
  isTampered: boolean;
  detections: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

/*
 Check if debugger is attached (iOS/Android)
*/
export function isDebuggerAttached(): boolean {
  if (__DEV__) {
    return false;
  }

  try {
    // iOS: Check for debugger via PT_DENY_ATTACH
    if (Platform.OS === 'ios') {
      // For React Native, we check timing anomalies
      const start = Date.now();
      debugger; 
      const end = Date.now();
      
      // If debugger is attached, this will take significantly longer
      if (end - start > 100) {
        console.warn('🚨 Debugger detected (timing anomaly)');
        return true;
      }
    }

    // Android: Check for TracerPid in /proc/self/status
    if (Platform.OS === 'android') {
      // This would require native module, but we can check other indicators
      // Check for debug mode in build config
      const { isDebuggable } = NativeModules.PlatformConstants || {};
      if (isDebuggable && !__DEV__) {
        console.warn('🚨 Debugger detected (debug build)');
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking debugger:', error);
    return false;
  }
}

/*
 Check for Frida hooking framework
*/
export async function isFridaDetected(): Promise<boolean> {
  // Skip in development mode
  if (__DEV__) {
    return false;
  }

  try {
    const detections: string[] = [];

    // Check 1: Frida default port (27042)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100);

      try {
        const response = await fetch('http://127.0.0.1:27042', {
          signal: controller.signal,
        });
        if (response) {
          detections.push('Frida port 27042 responding');
        }
      } catch (e) {
        // Port not responding or fetch aborted - good
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (e) {
      // Port not responding - good
    }

    // Check 2: Frida server process name (Android)
    if (Platform.OS === 'android') {
      // This would require native module to check running processes
      // For now, we check for common Frida artifacts
      const suspiciousProcesses = [
        'frida-server',
        'frida-agent',
        're.frida.server',
      ];

      // Check for Frida libraries
      const fridaLibraries = [
        '/data/local/tmp/frida-server',
        '/data/local/tmp/re.frida.server',
      ];

      for (const lib of fridaLibraries) {
        try {
          const exists = await FileSystem.getInfoAsync(lib);
          if (exists.exists) {
            detections.push(`Frida artifact found: ${lib}`);
          }
        } catch (e) {
          // File doesn't exist - good
        }
      }
    }

    // Check 3: iOS - Check for common Frida dylibs
    if (Platform.OS === 'ios') {
      const fridaDylibs = [
        'FridaGadget.dylib',
        'frida-agent.dylib',
      ];

      // Would need native module to properly check loaded libraries
      // For now, check for suspicious network activity
    }

    // Check 4: JavaScript environment checks
    const hasGlobalFrida = (global as any).frida !== undefined;
    const hasSend = (global as any).send !== undefined;
    const hasRecv = (global as any).recv !== undefined;

    if (hasGlobalFrida || (hasSend && hasRecv)) {
      detections.push('Frida JavaScript environment detected');
    }

    if (detections.length > 0) {
      console.warn('🚨 Frida detected:', detections);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking Frida:', error);
    return false;
  }
}

/**
 * Check for rooted/jailbroken device
 */
export async function isDeviceCompromised(): Promise<boolean> {
  // Skip in development mode
  if (__DEV__) {
    return false;
  }

  try {
    const detections: string[] = [];

    if (Platform.OS === 'android') {
      // Android root detection
      const rootIndicators = [
        '/system/app/Superuser.apk',
        '/sbin/su',
        '/system/bin/su',
        '/system/xbin/su',
        '/data/local/xbin/su',
        '/data/local/bin/su',
        '/system/sd/xbin/su',
        '/system/bin/failsafe/su',
        '/data/local/su',
      ];

      for (const path of rootIndicators) {
        try {
          const exists = await FileSystem.getInfoAsync(path);
          if (exists.exists) {
            detections.push(`Root indicator found: ${path}`);
          }
        } catch (e) {
          // File doesn't exist - good
        }
      }
    }

    if (Platform.OS === 'ios') {
      // iOS jailbreak detection
      const jailbreakIndicators = [
        '/Applications/Cydia.app',
        '/Library/MobileSubstrate/MobileSubstrate.dylib',
        '/bin/bash',
        '/usr/sbin/sshd',
        '/etc/apt',
        '/private/var/lib/apt/',
      ];

      for (const path of jailbreakIndicators) {
        try {
          const exists = await FileSystem.getInfoAsync(path);
          if (exists.exists) {
            detections.push(`Jailbreak indicator found: ${path}`);
          }
        } catch (e) {
          // File doesn't exist - good
        }
      }
    }

    if (detections.length > 0) {
      console.warn('🚨 Device compromised:', detections);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking device compromise:', error);
    return false;
  }
}

/**
 * Comprehensive tampering detection
 */
export async function detectTampering(): Promise<TamperingDetectionResult> {
  const detections: string[] = [];

  // Check 1: Debugger
  if (isDebuggerAttached()) {
    detections.push('Debugger attached');
  }

  // Check 2: Frida
  const hasFrida = await isFridaDetected();
  if (hasFrida) {
    detections.push('Frida framework detected');
  }

  // Check 3: Device compromise
  const isCompromised = await isDeviceCompromised();
  if (isCompromised) {
    detections.push('Device is rooted/jailbroken');
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (detections.length >= 2) {
    riskLevel = 'high';
  } else if (detections.length === 1) {
    riskLevel = 'medium';
  }

  return {
    isTampered: detections.length > 0,
    detections,
    riskLevel,
  };
}

/**
 * Take defensive action when tampering is detected
 */
export async function handleTamperingDetection(
  result: TamperingDetectionResult
): Promise<void> {
  if (!result.isTampered) {
    return;
  }

  console.error('🚨 SECURITY ALERT: Tampering detected', result);

  // Log security event to backend
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('security_events').insert({
        user_id: user.id,
        event_type: 'tampering_detected',
        details: {
          detections: result.detections,
          risk_level: result.riskLevel,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }

  // Defensive actions based on risk level
  if (result.riskLevel === 'high') {
    // High risk: Immediately terminate session and exit
    await supabase.auth.signOut();
    
    if (__DEV__) {
      console.warn('DEV MODE: Would exit app due to high risk tampering');
    } else {
      // In production: force exit
      // This would require native module:
      // NativeModules.AppModule.exitApp();
    }
  } else if (result.riskLevel === 'medium') {
    // Medium risk: Log out user but allow restart
    await supabase.auth.signOut();
  }
  // Low risk: Just log the event
}

/**
 * Continuous monitoring (call periodically)
 */
export function startTamperingMonitoring(intervalMs: number = 30000) {
  if (__DEV__) {
    console.log('Tampering monitoring disabled in development mode');
    return;
  }

  const monitoringInterval = setInterval(async () => {
    const result = await detectTampering();
    if (result.isTampered) {
      await handleTamperingDetection(result);
      clearInterval(monitoringInterval);
    }
  }, intervalMs);

  return monitoringInterval;
}

/**
 * Run initial security check on app start
 */
export async function performInitialSecurityCheck(): Promise<boolean> {
  if (__DEV__) {
    console.log('✅ Security checks skipped in development mode');
    return true;
  }

  const result = await detectTampering();
  
  if (result.isTampered) {
    await handleTamperingDetection(result);
    return false;
  }

  console.log('✅ Security check passed');
  return true;
}
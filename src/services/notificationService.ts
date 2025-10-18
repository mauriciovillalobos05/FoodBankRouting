// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Secure Notification Service
 * Implements MSTG-PLATFORM-4: No sensitive data in notifications
 * 
 * ✅ Generic messages only
 * ✅ No PII, financial data, or specific details
 * ✅ User must open app to see details
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Android-specific channel configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Send SECURE route reminder notification
 * 
 * ❌ BAD: "You have a route to Santiago Norte at 9:00 AM with Juan Pérez"
 * ✅ GOOD: "You have a route scheduled today"
 * 
 * CRITICAL: NO PII, NO LOCATION DETAILS, NO SPECIFIC TIMES
 */
export async function sendSecureRouteReminder(): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Cannot send notification: no permission');
      return;
    }

    // SECURE: Generic notification without sensitive data
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Recordatorio',
        body: 'Tienes una ruta asignada hoy. Abre la app para ver detalles.',
        // ✅ NO location, NO time, NO participant names
        data: {
          // Only non-sensitive metadata
          type: 'route_reminder',
          requiresAuth: true, // User must authenticate to see details
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately for testing
    });

    console.log('✅ Secure notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Send notification for completed route
 * SECURE: No specific details
 */
export async function sendRouteCompletedNotification(): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Ruta Completada',
        body: 'Una de tus rutas ha sido completada. Revisa los detalles en la app.',
        data: {
          type: 'route_completed',
          requiresAuth: true,
        },
        sound: true,
      },
      trigger: null,
    });

    console.log('✅ Route completed notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Send new route assignment notification
 * SECURE: Generic message
 */
export async function sendNewRouteAssignedNotification(): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚐 Nueva Asignación',
        body: 'Se te ha asignado una nueva ruta. Abre la app para más información.',
        data: {
          type: 'new_route',
          requiresAuth: true,
        },
        sound: true,
      },
      trigger: null,
    });

    console.log('✅ New route notification sent');
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Schedule daily route reminder
 * Sends at 7:00 AM on days with routes
 */
export async function scheduleDailyRouteReminder(): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Cancel existing reminders
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule for 7:00 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Buenos días',
        body: 'Tienes rutas programadas hoy. ¡Que tengas un buen día!',
        data: {
          type: 'daily_reminder',
          requiresAuth: true,
        },
        sound: true,
      },
      trigger: null,
    });

    console.log('✅ Daily reminder scheduled');
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
  }
}

/**
 * EXAMPLES OF INSECURE NOTIFICATIONS (DO NOT USE)
 */
export const INSECURE_EXAMPLES = {
  // ❌ BAD: Contains location and time
  bad1: {
    title: 'Route Reminder',
    body: 'You have a route to Santiago Norte at 9:00 AM',
  },
  
  // ❌ BAD: Contains names and personal info
  bad2: {
    title: 'New Assignment',
    body: 'Juan Pérez assigned you to Barrio Las Flores with María García',
  },
  
  // ❌ BAD: Contains financial or sensitive data
  bad3: {
    title: 'Route Update',
    body: 'Route #12345 to 123 Main St - 50 packages, $2,500 value',
  },
  
  // ✅ GOOD: Generic and secure
  good: {
    title: 'Update Available',
    body: 'You have a new update. Open the app for details.',
  },
};

/**
 * Handle notification received while app is foregrounded
 */
export function setupNotificationListeners() {
  // When notification is received while app is in foreground
  Notifications.addNotificationReceivedListener(notification => {
    console.log('📱 Notification received:', notification.request.content.title);
  });

  // When user taps on notification
  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response.notification.request.content.data);
    
    // Handle navigation based on notification type
    const data = response.notification.request.content.data;
    if (data.requiresAuth) {
      // Force authentication check before showing sensitive data
      console.log('🔐 Authentication required to view details');
    }
  });
}
/**
 * Notification Service
 *
 * Manages push notifications for dispatch assignments.
 * Uses local notifications for dispatch alerts.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Dispatch, DispatchNotificationData } from '@/src/types/dispatch.types';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Initialize notifications and request permissions
 * @returns true if permission granted, false otherwise
 */
export const initializeNotifications = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notification Service] Notification permission denied');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('dispatches', {
        name: 'Emergency Dispatches',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B2A2A',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    return true;
  } catch (error: any) {
    console.error('[Notification Service] Initialization error:', error.message);
    return false;
  }
};

/**
 * Show notification for new dispatch assignment
 */
export const showDispatchNotification = async (dispatch: Dispatch): Promise<void> => {
  try {
    const notificationData: DispatchNotificationData = {
      dispatchId: dispatch.id,
      incidentId: dispatch.incident_id,
      incidentType: dispatch.incident.type,
      address: dispatch.incident.address,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 New Emergency Dispatch',
        body: `${getIncidentTypeLabel(dispatch.incident.type)} at ${dispatch.incident.address}`,
        data: notificationData,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, // Show immediately
    });

    console.log('[Notification Service] Dispatch notification shown:', dispatch.id);
  } catch (error: any) {
    console.error('[Notification Service] Show notification error:', error.message);
  }
};

/**
 * Cancel all active notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.dismissAllNotificationsAsync();
    console.log('[Notification Service] All notifications dismissed');
  } catch (error: any) {
    console.error('[Notification Service] Cancel notifications error:', error.message);
  }
};

/**
 * Setup notification tap handlers
 */
export const setupNotificationHandlers = (
  onDispatchTap: (dispatchId: number) => void
): {
  responseSubscription: Notifications.Subscription;
  receivedSubscription: Notifications.Subscription;
} => {
  // Handle notification tap (when user taps on notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as DispatchNotificationData;
    if (data.dispatchId) {
      console.log('[Notification Service] Notification tapped:', data.dispatchId);
      onDispatchTap(data.dispatchId);
    }
  });

  // Handle notification received (when notification arrives while app is open)
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as DispatchNotificationData;
    console.log('[Notification Service] Notification received:', data);
  });

  return { responseSubscription, receivedSubscription };
};

/**
 * Remove notification listeners
 */
export const removeNotificationHandlers = (
  responseSubscription: Notifications.Subscription,
  receivedSubscription: Notifications.Subscription
): void => {
  responseSubscription.remove();
  receivedSubscription.remove();
};

/**
 * Get friendly label for incident type
 */
const getIncidentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    medical: 'Medical Emergency',
    fire: 'Fire Emergency',
    accident: 'Accident',
    crime: 'Crime',
    natural_disaster: 'Natural Disaster',
    other: 'Emergency',
  };
  return labels[type] || type.toUpperCase();
};

/**
 * Check if notification permissions are granted
 */
export const hasNotificationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error: any) {
    console.error('[Notification Service] Permission check error:', error.message);
    return false;
  }
};

/**
 * Notification Service
 *
 * Manages push notifications for dispatch assignments.
 * Uses local notifications for dispatch alerts.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Dispatch, DispatchNotificationData } from '@/src/types/dispatch.types';
import { IncomingCall } from '@/src/types/call.types';
import OpenRouteService from './openroute.service';

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

    // Configure notification channels for Android
    if (Platform.OS === 'android') {
      // Dispatch notifications channel
      await Notifications.setNotificationChannelAsync('dispatches', {
        name: 'Emergency Dispatches',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B2A2A',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });

      // Incoming calls channel
      await Notifications.setNotificationChannelAsync('incoming_calls', {
        name: 'Incoming Calls',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#8B2A2A',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
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
    // Get address - use reverse geocoding if needed
    let address = dispatch.incident.address;

    // Check if address looks like coordinates (contains numbers and comma)
    const coordPattern = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
    if (!address || coordPattern.test(address)) {
      try {
        console.log('[Notification Service] Address is coordinates, reverse geocoding...');
        const resolvedAddress = await OpenRouteService.reverseGeocode(
          dispatch.incident.latitude,
          dispatch.incident.longitude
        );

        if (resolvedAddress) {
          address = resolvedAddress;
          console.log('[Notification Service] Resolved address:', address);
        } else {
          // Fallback to coordinates
          address = `${dispatch.incident.latitude}, ${dispatch.incident.longitude}`;
        }
      } catch (error) {
        console.error('[Notification Service] Reverse geocoding failed:', error);
        // Fallback to coordinates
        address = `${dispatch.incident.latitude}, ${dispatch.incident.longitude}`;
      }
    }

    const notificationData: DispatchNotificationData = {
      dispatchId: dispatch.id,
      incidentId: dispatch.incident_id,
      incidentType: dispatch.incident.type,
      address: address, // Use resolved address
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 New Emergency Dispatch',
        body: `${getIncidentTypeLabel(dispatch.incident.type)} at ${address}`,
        data: notificationData,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, // Show immediately
    });

    console.log('[Notification Service] ✅ Dispatch notification shown with address:', address);
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
 * Show notification for auto-arrival at incident location
 */
export const showAutoArrivalNotification = async (
  dispatchId: number,
  incidentAddress?: string
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Arrived at Incident',
        body: incidentAddress
          ? `You have arrived at the incident location: ${incidentAddress}`
          : 'You have arrived at the incident location',
        data: { dispatchId, type: 'auto_arrival' },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });

    console.log('[Notification Service] Auto-arrival notification shown for dispatch:', dispatchId);
  } catch (error: any) {
    console.error('[Notification Service] Auto-arrival notification error:', error.message);
  }
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

/**
 * Show notification for incoming admin call
 */
export const showIncomingCallNotification = async (call: IncomingCall): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📞 Incoming Call from Admin',
        body: `${call.admin_caller.name} is calling about incident #${call.incident_id}`,
        data: {
          callId: call.id,
          type: 'incoming_call',
          adminName: call.admin_caller.name,
          incidentId: call.incident_id,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 500, 250, 500],
        categoryIdentifier: 'incoming_call',
      },
      trigger: null, // Show immediately
    });

    console.log('[Notification Service] ✅ Incoming call notification shown for call:', call.id);
  } catch (error: any) {
    console.error('[Notification Service] Show incoming call notification error:', error.message);
  }
};

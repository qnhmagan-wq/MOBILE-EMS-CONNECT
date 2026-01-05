/**
 * Background Location Service
 *
 * Manages background location tracking using expo-task-manager.
 * Runs even when app is closed or minimized.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { updateLocation } from './dispatch.service';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

/**
 * Define the background location task
 * This runs every 15 seconds when registered
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Background Location Task] Error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];

    if (location) {
      console.log('[Background Location Task] New location:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date(location.timestamp).toISOString(),
      });

      try {
        // Send location to backend
        await updateLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log('[Background Location Task] Location updated successfully');
      } catch (error: any) {
        console.error('[Background Location Task] Failed to update location:', error.message);
        // Don't throw - let task continue even if API fails
      }
    }
  }
});

/**
 * Request background location permissions
 */
export const requestBackgroundLocationPermissions = async (): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> => {
  try {
    // First request foreground permission
    const foregroundPerm = await Location.requestForegroundPermissionsAsync();
    console.log('[Background Location] Foreground permission:', foregroundPerm.status);

    if (foregroundPerm.status !== 'granted') {
      return { granted: false, canAskAgain: foregroundPerm.canAskAgain };
    }

    // Then request background permission (iOS/Android 10+)
    const backgroundPerm = await Location.requestBackgroundPermissionsAsync();
    console.log('[Background Location] Background permission:', backgroundPerm.status);

    return {
      granted: backgroundPerm.status === 'granted',
      canAskAgain: backgroundPerm.canAskAgain,
    };
  } catch (error: any) {
    console.error('[Background Location] Permission request error:', error);
    return { granted: false, canAskAgain: false };
  }
};

/**
 * Start background location tracking
 * **FIX #6: Added retry logic for reliability**
 */
export const startBackgroundLocationTracking = async (retryCount = 0): Promise<void> => {
  const MAX_RETRIES = 3;

  try {
    console.log('[Background Location] Starting background location tracking');

    // Check if task is already running
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      console.log('[Background Location] Task already running');
      return;
    }

    // Request foreground permission first
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      throw new Error('Foreground location permission denied');
    }

    // **FIX #7: Reduced interval from 15s to 10s for faster updates**
    // Start background location updates
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // Update every 10 seconds (reduced from 15000)
      distanceInterval: 0, // Update on every position change
      foregroundService: {
        notificationTitle: 'EMS Connect Active',
        notificationBody: 'Tracking your location for emergency dispatch',
        notificationColor: '#8B2A2A', // Brand primary color
      },
      pausesUpdatesAutomatically: false, // Keep tracking even when stationary
      showsBackgroundLocationIndicator: true, // iOS: show blue bar
    });

    console.log('[Background Location] Background tracking started successfully');
  } catch (error: any) {
    console.error('[Background Location] Failed to start:', error);

    // **FIX #6: Retry logic**
    if (retryCount < MAX_RETRIES) {
      console.log(`[Background Location] Retrying... (${retryCount + 1}/${MAX_RETRIES})`);

      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Retry
      return startBackgroundLocationTracking(retryCount + 1);
    } else {
      console.error('[Background Location] Max retries reached, background tracking failed');
      throw error;
    }
  }
};

/**
 * Stop background location tracking
 */
export const stopBackgroundLocationTracking = async (): Promise<void> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('[Background Location] Background tracking stopped');
    }
  } catch (error: any) {
    console.error('[Background Location] Failed to stop tracking:', error);
  }
};

/**
 * Check if background location tracking is running
 */
export const isBackgroundTrackingActive = async (): Promise<boolean> => {
  try {
    return await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  } catch {
    return false;
  }
};

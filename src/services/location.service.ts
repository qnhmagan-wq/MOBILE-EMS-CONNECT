/**
 * Location Service
 *
 * Manages location permissions and GPS tracking for responders.
 * Supports continuous location tracking and auto-arrival detection.
 */

import * as Location from 'expo-location';
import { LocationUpdate } from '@/src/types/dispatch.types';

/**
 * Permission request result
 */
export interface LocationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

/**
 * Continuous location tracking subscription
 */
let locationSubscription: Location.LocationSubscription | null = null;
let lastKnownLocation: LocationUpdate | null = null;

/**
 * Request foreground location permissions
 */
export const requestLocationPermissions = async (): Promise<LocationPermissionResult> => {
  try {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';

    if (!granted) {
      console.warn('[Location Service] Location permission denied');
    }

    return {
      granted,
      canAskAgain,
    };
  } catch (error: any) {
    console.error('[Location Service] Permission request error:', error.message);
    throw new Error('Failed to request location permissions');
  }
};

/**
 * Get current location with high accuracy and timeout
 * @param timeoutMs Maximum time to wait for GPS (default: 10 seconds)
 */
export const getCurrentLocation = async (timeoutMs: number = 10000): Promise<LocationUpdate> => {
  try {
    // Check if permission is granted
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    // Create location request promise
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Location request timed out. GPS signal may be weak.'));
      }, timeoutMs);
    });

    // Race between location and timeout
    const location = await Promise.race([locationPromise, timeoutPromise]);

    const update: LocationUpdate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
    };

    // Update cached location
    lastKnownLocation = update;
    console.log('[Location Service] Location updated:', update);

    return update;
  } catch (error: any) {
    console.error('[Location Service] Get location error:', error.message);

    // If timeout occurred and we have a cached location, suggest using it
    if (error.message?.includes('timeout') && lastKnownLocation) {
      console.warn('[Location Service] Timeout - using last known location');
      // Note: Caller should handle this by checking lastKnownLocation separately if needed
    }

    throw error;
  }
};

/**
 * Start continuous location tracking
 * @param callback Function to call on each location update
 * @param options Tracking options (accuracy, distance filter)
 */
export const startContinuousTracking = async (
  callback: (location: LocationUpdate) => void,
  options?: {
    accuracy?: Location.Accuracy;
    distanceInterval?: number;
    timeInterval?: number;
  }
): Promise<void> => {
  try {
    // Check permission
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    // Stop any existing subscription
    if (locationSubscription) {
      locationSubscription.remove();
    }

    console.log('[Location Service] Starting continuous tracking');

    // Start watching position
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: options?.accuracy || Location.Accuracy.High,
        distanceInterval: options?.distanceInterval || 10, // Update every 10 meters
        timeInterval: options?.timeInterval || 5000, // Or every 5 seconds
      },
      (location) => {
        const update: LocationUpdate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        };

        lastKnownLocation = update;
        callback(update);
      }
    );
  } catch (error: any) {
    console.error('[Location Service] Start tracking error:', error.message);
    throw error;
  }
};

/**
 * Stop continuous location tracking
 */
export const stopContinuousTracking = (): void => {
  if (locationSubscription) {
    console.log('[Location Service] Stopping continuous tracking');
    locationSubscription.remove();
    locationSubscription = null;
  }
};

/**
 * Get last known location (cached)
 */
export const getLastKnownLocation = (): LocationUpdate | null => {
  return lastKnownLocation;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Check if location permissions are granted
 */
export const hasLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error: any) {
    console.error('[Location Service] Permission check error:', error.message);
    return false;
  }
};

/**
 * Get readable error message for location errors
 */
export const getLocationErrorMessage = (error: any): string => {
  if (error.message?.includes('permission')) {
    return 'Location permission is required. Please enable location access in settings.';
  }
  if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
    return 'GPS signal is weak or unavailable. Please ensure you have a clear view of the sky and GPS is enabled.';
  }
  if (error.message?.includes('unavailable')) {
    return 'Location services are unavailable. Please check your device settings.';
  }
  if (error.message?.includes('denied')) {
    return 'Location permission was denied. Please enable it in your device settings.';
  }
  return 'Failed to get your current location. Please try again.';
};

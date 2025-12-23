/**
 * Location Service
 *
 * Manages location permissions and GPS tracking for responders.
 * Uses foreground-only location tracking (app must be open).
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
 * Get current location with high accuracy
 */
export const getCurrentLocation = async (): Promise<LocationUpdate> => {
  try {
    // Check if permission is granted
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    // Get current position with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
    };
  } catch (error: any) {
    console.error('[Location Service] Get location error:', error.message);
    throw error;
  }
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
  if (error.message?.includes('timeout')) {
    return 'Location request timed out. Please ensure GPS is enabled.';
  }
  if (error.message?.includes('unavailable')) {
    return 'Location services are unavailable. Please check your device settings.';
  }
  return 'Failed to get your current location. Please try again.';
};

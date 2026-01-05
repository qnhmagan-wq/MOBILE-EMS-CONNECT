/**
 * DispatchContext
 *
 * Global state management for dispatch system including:
 * - Duty status management
 * - Location tracking
 * - Dispatch polling and management
 *
 * Pattern: Follows AuthContext.tsx pattern
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import { DutyStatus, Dispatch, DispatchStatus } from '@/src/types/dispatch.types';
import { useDispatchPolling } from '@/src/hooks/useDispatchPolling';
import * as dispatchService from '@/src/services/dispatch.service';
import * as locationService from '@/src/services/location.service';
import * as notificationService from '@/src/services/notification.service';
import { trackAction, ActionTypes } from '@/src/utils/actionTracking';
import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  requestBackgroundLocationPermissions,
  isBackgroundTrackingActive,
} from '@/src/services/backgroundLocation.service';
import { useAuth } from './AuthContext';

const LOCATION_UPDATE_INTERVAL = 15000; // 15 seconds (as per dev guide)

export interface DispatchContextType {
  // Location Tracking
  isTrackingActive: boolean;
  hasLocationPermission: boolean;
  // **FIX #4: Backend verification state**
  locationLastSent: Date | null;
  isBackendConfirmed: boolean;

  // Dispatches
  dispatches: Dispatch[];
  activeDispatches: Dispatch[];

  // Actions
  autoStartTracking: () => Promise<void>;
  updateDispatchStatus: (dispatchId: number, status: DispatchStatus) => Promise<void>;
  refreshDispatches: () => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const DispatchContext = createContext<DispatchContextType | undefined>(undefined);

export const DispatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // **FIX #4: Backend verification state**
  const [locationLastSent, setLocationLastSent] = useState<Date | null>(null);
  const [isBackendConfirmed, setIsBackendConfirmed] = useState(false);

  // **FIX #2: Location interval ref for foreground updates**
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use dispatch polling hook
  const {
    dispatches,
    activeDispatches,
    isPolling,
    startPolling,
    stopPolling,
    updateDispatchStatus: updateDispatchStatusHook,
    refreshDispatches,
    error: pollingError,
    clearError: clearPollingError,
  } = useDispatchPolling();

  /**
   * **FIX #2 & #4: Send current location to backend with verification**
   * Used for periodic foreground updates as fallback
   */
  const sendLocationUpdate = useCallback(async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        const response = await dispatchService.updateLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        console.log('[DispatchContext] Location update response:', response);

        // **FIX #4: Confirm backend received the location**
        if (response.message === 'Location updated successfully') {
          setLocationLastSent(new Date());
          setIsBackendConfirmed(true);
        }
      }
    } catch (error) {
      console.error('[DispatchContext] Foreground location update failed:', error);
      setIsBackendConfirmed(false);
    }
  }, []);

  /**
   * **FIX #2: Start periodic foreground location updates**
   * Sends location every 15 seconds as fallback if background task fails
   */
  const startPeriodicLocationUpdates = useCallback(() => {
    console.log('[DispatchContext] Starting periodic foreground location updates');

    // Clear any existing interval
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }

    // Send updates every 15 seconds
    locationIntervalRef.current = setInterval(sendLocationUpdate, LOCATION_UPDATE_INTERVAL);
  }, [sendLocationUpdate]);

  /**
   * **FIX #2: Stop periodic foreground location updates**
   */
  const stopPeriodicLocationUpdates = useCallback(() => {
    console.log('[DispatchContext] Stopping periodic foreground location updates');

    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  /**
   * Automatically start location tracking when permission is granted
   * Called on app entry and after permission grant
   */
  const autoStartTracking = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[DispatchContext] Auto-starting location tracking...');

      // Request permissions
      const locationPerm = await requestBackgroundLocationPermissions();
      setHasLocationPermission(locationPerm.granted);

      if (!locationPerm.granted) {
        console.log('[DispatchContext] Location permission denied, cannot start tracking');
        setIsLoading(false);

        // **FIX #3: Show user-facing error for permission denial**
        Alert.alert(
          'Location Permission Required',
          'Background location access is required to track your location while on duty. Please enable location permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );

        return;
      }

      // Request notification permission
      const notifPerm = await notificationService.initializeNotifications();
      if (!notifPerm) {
        Alert.alert(
          'Notification Permission',
          'Notifications are disabled. You may not receive dispatch alerts.',
          [{ text: 'OK' }]
        );
      }

      // Update backend duty status (keep trying even if it fails)
      try {
        await dispatchService.updateDutyStatus({
          is_on_duty: true,
          responder_status: 'idle',
        });
        console.log('[DispatchContext] Backend duty status updated successfully');
      } catch (error: any) {
        console.error('[DispatchContext] Backend duty status failed (continuing anyway):', error.message);
        // Don't throw - continue with local tracking even if backend fails
      }

      // Start background location tracking
      await startBackgroundLocationTracking();
      setIsTrackingActive(true);

      // **FIX #1: Send immediate location update to backend**
      // This ensures admin sees responder immediately instead of waiting 15 seconds for first background update
      try {
        console.log('[DispatchContext] Sending initial location update');
        const currentLocation = await locationService.getCurrentLocation();

        if (currentLocation) {
          await dispatchService.updateLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
          console.log('[DispatchContext] Initial location sent to backend:', {
            lat: currentLocation.coords.latitude,
            lng: currentLocation.coords.longitude,
          });
        }
      } catch (error) {
        console.error('[DispatchContext] Failed to send initial location:', error);
        // Don't throw - continue with background tracking
      }

      // **FIX #2: Start foreground fallback updates**
      startPeriodicLocationUpdates();

      // Start dispatch polling
      startPolling();

      console.log('[DispatchContext] Auto-start complete: tracking active');
    } catch (error: any) {
      console.error('[DispatchContext] Auto-start failed:', error);
      setError(error.message || 'Failed to start location tracking');
      Alert.alert(
        'Location Tracking Error',
        'Failed to start automatic location tracking. Please check your permissions.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [startPolling, startPeriodicLocationUpdates]);

  /**
   * Update dispatch status wrapper
   */
  const updateDispatchStatus = useCallback(
    async (dispatchId: number, status: DispatchStatus) => {
      try {
        await updateDispatchStatusHook(dispatchId, status);
      } catch (error) {
        // Error already handled in hook
        throw error;
      }
    },
    [updateDispatchStatusHook]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
    clearPollingError();
  }, [clearPollingError]);

  /**
   * Auto-start tracking when responder enters the app
   * Only runs if location permission is granted
   */
  useEffect(() => {
    if (!user || user.role !== 'responder') return;

    console.log('[DispatchContext] Responder detected, checking auto-start...');

    // Check if already tracking
    isBackgroundTrackingActive().then((isActive) => {
      if (isActive) {
        console.log('[DispatchContext] Background tracking already active');
        setIsTrackingActive(true);
        startPolling();
      } else {
        console.log('[DispatchContext] Starting auto-start sequence...');
        autoStartTracking();
      }
    });

    // Cleanup on unmount
    return () => {
      stopPolling();
      // **FIX #2: Cleanup foreground location updates**
      stopPeriodicLocationUpdates();
    };
  }, [user, autoStartTracking, startPolling, stopPolling, stopPeriodicLocationUpdates]);

  /**
   * Sync error from polling hook
   */
  useEffect(() => {
    if (pollingError) {
      setError(pollingError);
    }
  }, [pollingError]);

  const value: DispatchContextType = {
    isTrackingActive,
    hasLocationPermission,
    locationLastSent,
    isBackendConfirmed,
    dispatches,
    activeDispatches,
    autoStartTracking,
    updateDispatchStatus,
    refreshDispatches,
    isLoading,
    error,
    clearError,
  };

  return <DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>;
};

export const useDispatch = (): DispatchContextType => {
  const context = useContext(DispatchContext);
  if (context === undefined) {
    throw new Error('useDispatch must be used within a DispatchProvider');
  }
  return context;
};

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
import { Alert } from 'react-native';
import { DutyStatus, Dispatch, DispatchStatus } from '@/src/types/dispatch.types';
import { useDispatchPolling } from '@/src/hooks/useDispatchPolling';
import * as dispatchService from '@/src/services/dispatch.service';
import * as locationService from '@/src/services/location.service';
import * as notificationService from '@/src/services/notification.service';
import { trackAction, ActionTypes } from '@/src/utils/actionTracking';

const LOCATION_UPDATE_INTERVAL = 15000; // 15 seconds (as per dev guide)

export interface DispatchContextType {
  // Duty Status
  dutyStatus: DutyStatus;
  isOnDuty: boolean;

  // Location Tracking
  isLocationTracking: boolean;

  // Dispatches
  dispatches: Dispatch[];
  activeDispatches: Dispatch[];

  // Actions
  toggleDutyStatus: () => Promise<void>;
  updateDispatchStatus: (dispatchId: number, status: DispatchStatus) => Promise<void>;
  refreshDispatches: () => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const DispatchContext = createContext<DispatchContextType | undefined>(undefined);

export const DispatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>('off_duty');
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
   * Start location tracking (foreground-only)
   */
  const startLocationTracking = useCallback(async () => {
    try {
      console.log('[DispatchContext] Starting location tracking');

      // Initial location update
      const location = await locationService.getCurrentLocation();
      await dispatchService.updateLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Set up interval for periodic updates
      locationIntervalRef.current = setInterval(async () => {
        try {
          const location = await locationService.getCurrentLocation();
          await dispatchService.updateLocation({
            latitude: location.latitude,
            longitude: location.longitude,
          });
          console.log('[DispatchContext] Location updated');
        } catch (error: any) {
          console.error('[DispatchContext] Location update error:', error.message);
        }
      }, LOCATION_UPDATE_INTERVAL);

      setIsLocationTracking(true);
    } catch (error: any) {
      console.error('[DispatchContext] Start location tracking error:', error);
      throw error;
    }
  }, []);

  /**
   * Stop location tracking
   */
  const stopLocationTracking = useCallback(() => {
    console.log('[DispatchContext] Stopping location tracking');

    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    setIsLocationTracking(false);
  }, []);

  /**
   * Toggle duty status (on/off)
   */
  const toggleDutyStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const newStatus: DutyStatus = dutyStatus === 'off_duty' ? 'on_duty' : 'off_duty';

      // Track user action
      trackAction(ActionTypes.DUTY_TOGGLE, {
        from: dutyStatus,
        to: newStatus
      });

      if (newStatus === 'on_duty') {
        // TURNING ON DUTY

        // 1. Request location permission
        const locationPerm = await locationService.requestLocationPermissions();
        if (!locationPerm.granted) {
          throw new Error('Location permission is required to go on duty');
        }

        // 2. Request notification permission
        const notifPerm = await notificationService.initializeNotifications();
        if (!notifPerm) {
          Alert.alert(
            'Notification Permission',
            'Notifications are disabled. You won\'t receive alerts for new dispatches.',
            [{ text: 'OK' }]
          );
        }

        // 3. Update backend duty status
        await dispatchService.updateDutyStatus({
          is_on_duty: true,
          responder_status: 'idle',
        });

        // 4. Start location tracking
        await startLocationTracking();

        // 5. Start dispatch polling
        startPolling();

        // 6. Update local state
        setDutyStatus('on_duty');

        console.log('[DispatchContext] Successfully went ON DUTY');
        trackAction(ActionTypes.DUTY_ON, { success: true });
      } else {
        // TURNING OFF DUTY

        // 1. Stop services
        stopPolling();
        stopLocationTracking();

        // 2. Update backend duty status
        await dispatchService.updateDutyStatus({
          is_on_duty: false,
          responder_status: 'offline',
        });

        // 3. Update local state
        setDutyStatus('off_duty');

        console.log('[DispatchContext] Successfully went OFF DUTY');
        trackAction(ActionTypes.DUTY_OFF, { success: true });
      }
    } catch (err: any) {
      console.error('[DispatchContext] Toggle duty status error:', err);
      trackAction(ActionTypes.DUTY_TOGGLE_FAILED, {
        error: err.message,
        from: dutyStatus,
      });
      setError(err.message || 'Failed to update duty status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dutyStatus, startLocationTracking, stopLocationTracking, startPolling, stopPolling]);

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
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, []);

  /**
   * Sync error from polling hook
   */
  useEffect(() => {
    if (pollingError) {
      setError(pollingError);
    }
  }, [pollingError]);

  const value: DispatchContextType = {
    dutyStatus,
    isOnDuty: dutyStatus === 'on_duty',
    isLocationTracking,
    dispatches,
    activeDispatches,
    toggleDutyStatus,
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

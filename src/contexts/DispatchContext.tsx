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
  }, [startPolling]);

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
    };
  }, [user, autoStartTracking, startPolling, stopPolling]);

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

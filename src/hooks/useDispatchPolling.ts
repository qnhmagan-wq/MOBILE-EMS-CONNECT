/**
 * useDispatchPolling Hook
 *
 * Manages dispatch polling and notification for new assignments.
 * Pattern: Similar to useIncidents.ts but focused on dispatch management.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Dispatch, DispatchStatus, NearbyIncident } from '@/src/types/dispatch.types';
import * as dispatchService from '@/src/services/dispatch.service';
import * as notificationService from '@/src/services/notification.service';

const POLL_INTERVAL = 10000; // 10 seconds (was 5 seconds - reduced further to prevent UI stuttering)

export interface UseDispatchPollingReturn {
  dispatches: Dispatch[];
  activeDispatches: Dispatch[]; // Only active statuses
  nearbyIncidents: NearbyIncident[]; // Nearby pending incidents
  isPolling: boolean;
  error: string | null;
  startPolling: () => void;
  stopPolling: () => void;
  updateDispatchStatus: (dispatchId: number, status: DispatchStatus) => Promise<void>;
  refreshDispatches: () => Promise<void>;
  clearError: () => void;
}

export const useDispatchPolling = (): UseDispatchPollingReturn => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [nearbyIncidents, setNearbyIncidents] = useState<NearbyIncident[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeenDispatchIds = useRef<Set<number>>(new Set());
  const isPollingRef = useRef(false);
  const consecutiveFailuresRef = useRef<number>(0);

  /**
   * Fetch dispatches from API
   */
  const refreshDispatches = useCallback(async () => {
    try {
      console.log('[useDispatchPolling] Fetching dispatches...');
      const response = await dispatchService.getDispatches();
      const fetchedDispatches = response.dispatches || [];
      const fetchedNearby = response.nearby_incidents || [];

      console.log('[useDispatchPolling] Received:', {
        dispatches: fetchedDispatches.length,
        nearby: fetchedNearby.length,
        ids: fetchedDispatches.map((d) => d.id),
      });

      // Detect new dispatches (not seen before)
      const newDispatches = fetchedDispatches.filter(
        (dispatch) => !lastSeenDispatchIds.current.has(dispatch.id)
      );

      // Show notifications for new dispatches
      for (const dispatch of newDispatches) {
        await notificationService.showDispatchNotification(dispatch);
      }

      // Update last seen IDs
      lastSeenDispatchIds.current = new Set(fetchedDispatches.map((d) => d.id));

      setDispatches(fetchedDispatches);
      setNearbyIncidents(fetchedNearby);
      setError(null);
      consecutiveFailuresRef.current = 0;
    } catch (err: any) {
      consecutiveFailuresRef.current += 1;
      const statusCode = err.response?.status;

      console.error('[useDispatchPolling] Refresh error:', {
        attempt: consecutiveFailuresRef.current,
        status: statusCode,
        message: err.message,
      });

      // 401 handled by API interceptor (clears auth) - don't show error
      if (statusCode === 401) return;

      // Only show error after 3+ consecutive failures (absorbs transient init errors)
      if (consecutiveFailuresRef.current >= 3) {
        if (!err.response) {
          setError('Network connection lost. Please check your internet connection.');
        } else {
          setError('Failed to load dispatches. Please check your connection.');
        }
      }
    }
  }, []);

  /**
   * Start polling for dispatches
   * Uses isPollingRef to avoid stale closure issues
   */
  const startPolling = useCallback(() => {
    if (isPollingRef.current) {
      console.log('[useDispatchPolling] Already polling');
      return;
    }

    console.log('[useDispatchPolling] Starting dispatch polling');
    isPollingRef.current = true;
    setIsPolling(true);

    // Initial fetch
    refreshDispatches();

    // Set up interval
    intervalRef.current = setInterval(() => {
      refreshDispatches();
    }, POLL_INTERVAL);
  }, [refreshDispatches]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (!isPollingRef.current) {
      console.log('[useDispatchPolling] Not currently polling');
      return;
    }

    console.log('[useDispatchPolling] Stopping dispatch polling');
    isPollingRef.current = false;
    setIsPolling(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear dispatches and last seen IDs
    setDispatches([]);
    lastSeenDispatchIds.current.clear();
  }, []);

  /**
   * Update dispatch status
   */
  const updateDispatchStatus = useCallback(
    async (dispatchId: number, status: DispatchStatus) => {
      try {
        const response = await dispatchService.updateDispatchStatus(dispatchId, { status });

        // Update local state while preserving incident data
        setDispatches((prev) =>
          prev.map((dispatch) => {
            if (dispatch.id === dispatchId) {
              // Merge response with existing dispatch to preserve incident
              return {
                ...dispatch,              // Keep existing data (including incident)
                ...response.dispatch,     // Overwrite with updated fields (status, timestamps, etc.)
                incident: response.dispatch.incident || dispatch.incident,  // Preserve incident if backend doesn't send it
              };
            }
            return dispatch;
          })
        );

        setError(null);
      } catch (err: any) {
        console.error('[useDispatchPolling] Update status error:', err);
        setError('Failed to update dispatch status. Please try again.');
        throw err;
      }
    },
    []
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /**
   * Filter active dispatches (not completed or declined)
   */
  const activeDispatches = dispatches.filter(
    (dispatch) => !['completed', 'declined'].includes(dispatch.status)
  );

  return {
    dispatches,
    activeDispatches,
    nearbyIncidents,
    isPolling,
    error,
    startPolling,
    stopPolling,
    updateDispatchStatus,
    refreshDispatches,
    clearError,
  };
};

/**
 * useDispatchPolling Hook
 *
 * Manages dispatch polling and notification for new assignments.
 * Pattern: Similar to useIncidents.ts but focused on dispatch management.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Dispatch, DispatchStatus } from '@/src/types/dispatch.types';
import * as dispatchService from '@/src/services/dispatch.service';
import * as notificationService from '@/src/services/notification.service';

const POLL_INTERVAL = 2000; // 5 seconds

export interface UseDispatchPollingReturn {
  dispatches: Dispatch[];
  activeDispatches: Dispatch[]; // Only active statuses
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
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeenDispatchIds = useRef<Set<number>>(new Set());

  /**
   * Fetch dispatches from API
   */
  const refreshDispatches = useCallback(async () => {
    try {
      const fetchedDispatches = await dispatchService.getDispatches();

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
      setError(null);
    } catch (err: any) {
      console.error('[useDispatchPolling] Refresh error:', err);
      setError('Failed to load dispatches. Please check your connection.');
    }
  }, []);

  /**
   * Start polling for dispatches
   */
  const startPolling = useCallback(() => {
    if (isPolling) {
      console.log('[useDispatchPolling] Already polling');
      return;
    }

    console.log('[useDispatchPolling] Starting dispatch polling');
    setIsPolling(true);

    // Initial fetch
    refreshDispatches();

    // Set up interval
    intervalRef.current = setInterval(() => {
      refreshDispatches();
    }, POLL_INTERVAL);
  }, [isPolling, refreshDispatches]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (!isPolling) {
      console.log('[useDispatchPolling] Not currently polling');
      return;
    }

    console.log('[useDispatchPolling] Stopping dispatch polling');
    setIsPolling(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear dispatches and last seen IDs
    setDispatches([]);
    lastSeenDispatchIds.current.clear();
  }, [isPolling]);

  /**
   * Update dispatch status
   */
  const updateDispatchStatus = useCallback(
    async (dispatchId: number, status: DispatchStatus) => {
      try {
        const response = await dispatchService.updateDispatchStatus(dispatchId, { status });

        // Update local state
        setDispatches((prev) =>
          prev.map((dispatch) =>
            dispatch.id === dispatchId ? response.dispatch : dispatch
          )
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
    isPolling,
    error,
    startPolling,
    stopPolling,
    updateDispatchStatus,
    refreshDispatches,
    clearError,
  };
};

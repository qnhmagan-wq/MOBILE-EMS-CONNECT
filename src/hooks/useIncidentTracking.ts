/**
 * useIncidentTracking Hook
 *
 * Manages real-time incident tracking with automatic polling.
 * Pattern: Similar to useDispatchPolling.ts but for community users tracking responders.
 *
 * Features:
 * - Automatic polling every 3 seconds
 * - Start/stop tracking for specific incidents
 * - Switch between incidents seamlessly
 * - Auto-stops when tracking unavailable
 * - Cleanup on unmount
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { TrackingResponse } from '@/src/types/tracking.types';
import * as trackingService from '@/src/services/tracking.service';

const POLL_INTERVAL = 3000; // 3 seconds (user specified for real-time updates)

export interface UseIncidentTrackingReturn {
  trackingData: TrackingResponse | null;
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
  startTracking: (incidentId: number) => void;
  stopTracking: () => void;
  refreshTracking: () => Promise<void>;
  clearError: () => void;
}

export const useIncidentTracking = (): UseIncidentTrackingReturn => {
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const incidentIdRef = useRef<number | null>(null);

  /**
   * Fetch tracking data from API
   * Called on initial load and every poll interval
   */
  const refreshTracking = useCallback(async () => {
    if (!incidentIdRef.current) return;

    try {
      const data = await trackingService.getIncidentTracking(incidentIdRef.current);
      setTrackingData(data);
      setError(null);

      // Auto-stop polling if tracking is no longer available
      // This happens when incident is completed or cancelled
      if (!data.tracking_available && intervalRef.current) {
        console.log('[useIncidentTracking] Tracking no longer available, stopping polling');
        stopTracking();
      }
    } catch (err: any) {
      console.error('[useIncidentTracking] Refresh error:', err);
      setError('Failed to load tracking data. Please check your connection.');
    }
  }, []);

  /**
   * Start tracking a specific incident
   * If already tracking a different incident, stops old polling and starts new
   *
   * @param incidentId - Incident ID to start tracking
   */
  const startTracking = useCallback(
    (incidentId: number) => {
      // Stop existing polling if switching incidents
      if (intervalRef.current) {
        console.log('[useIncidentTracking] Switching incident, stopping previous polling');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      console.log('[useIncidentTracking] Starting tracking for incident:', incidentId);
      incidentIdRef.current = incidentId;
      setIsPolling(true);
      setIsLoading(true);

      // Initial fetch
      refreshTracking().finally(() => setIsLoading(false));

      // Set up polling interval (3 seconds)
      intervalRef.current = setInterval(refreshTracking, POLL_INTERVAL);
    },
    [refreshTracking]
  );

  /**
   * Stop tracking
   * Clears polling interval and resets polling state
   */
  const stopTracking = useCallback(() => {
    console.log('[useIncidentTracking] Stopping tracking');
    setIsPolling(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Keep incidentIdRef for potential resume, but could be cleared if needed
    // incidentIdRef.current = null;
  }, []);

  /**
   * Clear error state
   * Useful after showing error message to user
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Cleanup on unmount
   * Ensures no memory leaks from active polling intervals
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        console.log('[useIncidentTracking] Component unmounting, cleaning up polling');
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    trackingData,
    isLoading,
    isPolling,
    error,
    startTracking,
    stopTracking,
    refreshTracking,
    clearError,
  };
};

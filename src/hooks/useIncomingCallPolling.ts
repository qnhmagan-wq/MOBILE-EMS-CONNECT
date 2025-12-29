/**
 * useIncomingCallPolling Hook
 *
 * Manages polling for incoming admin calls
 * Pattern: Follows useDispatchPolling.ts pattern
 */

import { useState, useRef, useCallback } from 'react';
import { IncomingCall } from '@/src/types/call.types';
import { pollIncomingCall } from '@/src/services/call.service';

const POLL_INTERVAL = 3000; // 3 seconds

interface UseIncomingCallPollingReturn {
  incomingCall: IncomingCall | null;
  isPolling: boolean;
  error: string | null;
  startPolling: (onNewCall: (call: IncomingCall) => void, onCallCanceled: () => void) => void;
  stopPolling: () => void;
  clearError: () => void;
}

export const useIncomingCallPolling = (): UseIncomingCallPollingReturn => {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeenCallId = useRef<number | null>(null);
  const onNewCallRef = useRef<((call: IncomingCall) => void) | null>(null);
  const onCallCanceledRef = useRef<(() => void) | null>(null);

  /**
   * Poll once for incoming calls
   */
  const pollOnce = useCallback(async () => {
    try {
      const response = await pollIncomingCall();

      if (response.has_incoming_call && response.call) {
        const call = response.call;

        // Deduplication: Only process if new call
        if (lastSeenCallId.current !== call.id) {
          console.log('[IncomingCallPolling] New incoming call detected:', call.id);
          lastSeenCallId.current = call.id;
          setIncomingCall(call);

          // Notify callback
          if (onNewCallRef.current) {
            onNewCallRef.current(call);
          }
        }
      } else {
        // No incoming call
        if (incomingCall && lastSeenCallId.current) {
          // Call was canceled by admin
          console.log('[IncomingCallPolling] Call canceled by admin');
          setIncomingCall(null);

          // Notify callback
          if (onCallCanceledRef.current) {
            onCallCanceledRef.current();
          }
        }
      }

      // Clear error on successful poll
      setError(null);
    } catch (err: any) {
      console.error('[IncomingCallPolling] Poll error:', err.message);
      setError(err.message || 'Failed to poll for incoming calls');
      // Don't stop polling on error - network may recover
    }
  }, [incomingCall]);

  /**
   * Start polling
   */
  const startPolling = useCallback(
    (onNewCall: (call: IncomingCall) => void, onCallCanceled: () => void) => {
      if (isPolling) {
        console.log('[IncomingCallPolling] Already polling, skipping start');
        return;
      }

      console.log('[IncomingCallPolling] Starting polling');
      setIsPolling(true);
      onNewCallRef.current = onNewCall;
      onCallCanceledRef.current = onCallCanceled;

      // Initial poll
      pollOnce();

      // Set up interval
      intervalRef.current = setInterval(pollOnce, POLL_INTERVAL);
    },
    [isPolling, pollOnce]
  );

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (!isPolling) {
      return;
    }

    console.log('[IncomingCallPolling] Stopping polling');
    setIsPolling(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset state
    setIncomingCall(null);
    lastSeenCallId.current = null;
    onNewCallRef.current = null;
    onCallCanceledRef.current = null;
    setError(null);
  }, [isPolling]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    incomingCall,
    isPolling,
    error,
    startPolling,
    stopPolling,
    clearError,
  };
};

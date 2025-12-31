/**
 * IncomingCallContext
 *
 * Global state management for incoming admin calls including:
 * - Call polling and detection
 * - Ringtone/vibration management
 * - Call answer/reject flows
 * - Integration with Agora voice calling
 *
 * Pattern: Follows DispatchContext.tsx pattern
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IncomingCall, IncomingCallState } from '@/src/types/call.types';
import { useAuth } from '@/src/contexts/AuthContext';
import { useIncomingCallPolling } from '@/src/hooks/useIncomingCallPolling';
import * as callService from '@/src/services/call.service';
import * as ringtoneService from '@/src/services/ringtone.service';
import * as notificationService from '@/src/services/notification.service';

export interface IncomingCallContextType {
  // State
  incomingCall: IncomingCall | null;
  callState: IncomingCallState;
  isPolling: boolean;
  error: string | null;

  // Actions
  answerCall: () => Promise<{ success: boolean; channelName?: string; error?: string }>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;

  // Utility
  clearError: () => void;
}

const IncomingCallContext = createContext<IncomingCallContextType | undefined>(undefined);

export const IncomingCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();

  const [callState, setCallState] = useState<IncomingCallState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [shouldNavigateToIncomingCall, setShouldNavigateToIncomingCall] = useState(false);

  const isAnsweringRef = useRef(false);

  // Use polling hook
  const {
    incomingCall,
    isPolling,
    error: pollingError,
    startPolling,
    stopPolling,
    pausePolling,
    clearError: clearPollingError,
  } = useIncomingCallPolling();

  /**
   * Handle new incoming call
   */
  const handleNewCall = useCallback(
    async (call: IncomingCall) => {
      console.log('[IncomingCall] ===== HANDLE NEW CALL START =====');
      console.log('[IncomingCall] Call ID:', call.id);
      console.log('[IncomingCall] Call from:', call.admin_caller.name);
      console.log('[IncomingCall] Current callState:', callState);
      console.log('[IncomingCall] Router available:', !!router);

      try {
        console.log('[IncomingCall] Step 1: Checking for active calls...');
        const activeCall = await callService.getActiveCall();
        if (activeCall.call) {
          console.log('[IncomingCall] User is busy, auto-rejecting');
          await callService.rejectIncomingCall({ call_id: call.id });
          return;
        }
        console.log('[IncomingCall] ✓ No active calls found');

        console.log('[IncomingCall] Step 2: Checking callState...');
        if (callState !== 'idle') {
          console.log('[IncomingCall] Already handling a call, auto-rejecting');
          await callService.rejectIncomingCall({ call_id: call.id });
          return;
        }
        console.log('[IncomingCall] ✓ CallState is idle');

        console.log('[IncomingCall] Step 3: Setting state to ringing...');
        setCallState('ringing');
        console.log('[IncomingCall] ✓ State updated to ringing');

        console.log('[IncomingCall] Step 4: Starting ringtone...');
        await ringtoneService.playRingtone();
        console.log('[IncomingCall] ✓ Ringtone started');

        console.log('[IncomingCall] Step 5: Starting vibration...');
        await ringtoneService.startVibration();
        console.log('[IncomingCall] ✓ Vibration started');

        console.log('[IncomingCall] Step 6: Showing notification...');
        await notificationService.showIncomingCallNotification(call);
        console.log('[IncomingCall] ✓ Notification shown');

        console.log('[IncomingCall] Step 7: NAVIGATING TO SCREEN...');
        // Navigate immediately while all state is fresh
        setTimeout(() => {
          try {
            console.log('[IncomingCall] Attempting navigation to /incoming-call-modal');
            router.push('/incoming-call-modal');
            console.log('[IncomingCall] ✓ Navigation successful');
          } catch (navErr: any) {
            console.error('[IncomingCall] ❌ Navigation failed:', navErr);
            console.error('[IncomingCall] Falling back to flag-based navigation');
            setShouldNavigateToIncomingCall(true);
          }
        }, 100); // Small delay to ensure state propagation
        console.log('[IncomingCall] ✓ Navigation scheduled');

        console.log('[IncomingCall] ===== HANDLE NEW CALL END (SUCCESS) =====');
      } catch (err: any) {
        console.error('[IncomingCall] ❌❌❌ HANDLE NEW CALL ERROR ❌❌❌');
        console.error('[IncomingCall] Error type:', err?.constructor?.name);
        console.error('[IncomingCall] Error message:', err?.message);
        console.error('[IncomingCall] Error stack:', err?.stack);
        setError(err.message || 'Failed to process incoming call');
        console.log('[IncomingCall] ===== HANDLE NEW CALL END (ERROR) =====');
      }
    },
    [callState, router]
  );

  /**
   * Handle call canceled by admin
   */
  const handleCallCanceled = useCallback(async () => {
    console.log('[IncomingCall] Call canceled by admin');

    // Stop ringtone/vibration
    await ringtoneService.stopAll();

    // Reset state
    setCallState('idle');

    // Navigate back if on incoming call screen
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  /**
   * Answer incoming call
   */
  const answerCall = useCallback(async () => {
    if (!incomingCall) {
      return { success: false, error: 'No incoming call to answer' };
    }

    // Prevent double-answering
    if (isAnsweringRef.current) {
      console.log('[IncomingCall] Already answering, skipping');
      return { success: false, error: 'Already answering call' };
    }

    isAnsweringRef.current = true;

    try {
      console.log('[IncomingCall] Answering call:', incomingCall.id);

      // Stop ringtone/vibration
      await ringtoneService.stopAll();

      // Update state
      setCallState('answering');

      // Call backend answer API
      const response = await callService.answerIncomingCall({ call_id: incomingCall.id });

      console.log('[IncomingCall] Call answered, channel:', response.channel_name);

      // Update state to connected
      setCallState('connected');
      setShouldNavigateToIncomingCall(false); // Reset flag

      // Return channel info for Agora join (handled by screen)
      return {
        success: true,
        channelName: response.channel_name,
      };
    } catch (err: any) {
      console.error('[IncomingCall] Answer call error:', err);
      setError(err.message || 'Failed to answer call');
      setCallState('idle');

      Alert.alert(
        'Error',
        'Failed to answer call. Please try again or call emergency services directly.'
      );

      return {
        success: false,
        error: err.message || 'Failed to answer call',
      };
    } finally {
      isAnsweringRef.current = false;
    }
  }, [incomingCall]);

  /**
   * Reject incoming call
   */
  const rejectCall = useCallback(async () => {
    if (!incomingCall) {
      return;
    }

    try {
      console.log('[IncomingCall] Rejecting call:', incomingCall.id);

      // Stop ringtone/vibration
      await ringtoneService.stopAll();

      // Call backend reject API
      await callService.rejectIncomingCall({ call_id: incomingCall.id });

      // Reset state
      setCallState('idle');
      setShouldNavigateToIncomingCall(false); // Reset flag

      console.log('[IncomingCall] Call rejected successfully');
    } catch (err: any) {
      console.error('[IncomingCall] Reject call error:', err);
      setError(err.message || 'Failed to reject call');
    }
  }, [incomingCall]);

  /**
   * End active call
   */
  const endCall = useCallback(async () => {
    if (!incomingCall) {
      return;
    }

    try {
      console.log('[IncomingCall] Ending call:', incomingCall.id);

      // Call backend end API
      await callService.endCall({ call_id: incomingCall.id });

      // Stop any audio
      await ringtoneService.stopAll();

      // Reset state
      setCallState('ended');

      // Small delay before resetting to idle
      setTimeout(() => {
        setCallState('idle');
        setShouldNavigateToIncomingCall(false); // Reset flag
      }, 500);

      console.log('[IncomingCall] Call ended successfully');
    } catch (err: any) {
      console.error('[IncomingCall] End call error:', err);
      setError(err.message || 'Failed to end call');

      // Force reset state even on error
      setCallState('idle');
    }
  }, [incomingCall]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
    clearPollingError();
  }, [clearPollingError]);

  /**
   * Auto-start polling on login (community users only)
   */
  useEffect(() => {
    if (isAuthenticated && role === 'community') {
      console.log('[IncomingCall] Starting polling for community user');
      startPolling(handleNewCall, handleCallCanceled);
    } else {
      console.log('[IncomingCall] Stopping polling (not authenticated or not community user)');
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [isAuthenticated, role, startPolling, stopPolling, handleNewCall, handleCallCanceled]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      ringtoneService.stopAll();
    };
  }, []);

  /**
   * Sync polling error to local error state
   */
  useEffect(() => {
    if (pollingError) {
      setError(pollingError);
    }
  }, [pollingError]);

  /**
   * Navigate to incoming call screen when state is ready
   * This ensures incomingCall is available to the screen when it mounts
   */
  useEffect(() => {
    console.log('[DEBUG] Navigation Effect Triggered');
    console.log('[DEBUG] shouldNavigate:', shouldNavigateToIncomingCall);
    console.log('[DEBUG] incomingCall:', incomingCall?.id || 'null');
    console.log('[DEBUG] callState:', callState);

    if (shouldNavigateToIncomingCall && incomingCall && callState === 'ringing') {
      console.log('[IncomingCall] ===== NAVIGATING TO SCREEN =====');
      console.log('[IncomingCall] State is ready - incomingCall:', incomingCall.id);
      console.log('[IncomingCall] Call from:', incomingCall.admin_caller.name);

      // Small delay to ensure React has fully rendered the context update
      setTimeout(() => {
        console.log('[IncomingCall] Executing navigation...');
        try {
          router.push('/incoming-call-modal');
          console.log('[IncomingCall] ✓✓✓ Navigation successful! Screen should now have call data.');
        } catch (navErr: any) {
          console.error('[IncomingCall] ❌ Navigation error:', navErr);
          // Fallback: try replace
          try {
            router.replace('/incoming-call-modal');
            console.log('[IncomingCall] ✓ Fallback navigation successful');
          } catch (replaceErr: any) {
            console.error('[IncomingCall] ❌ Fallback also failed:', replaceErr);
          }
        }

        // Reset flag
        setShouldNavigateToIncomingCall(false);
      }, 50); // Minimal delay just to ensure render cycle completes
    } else {
      console.log('[DEBUG] Navigation blocked:');
      console.log('  - shouldNavigate:', shouldNavigateToIncomingCall);
      console.log('  - hasIncomingCall:', !!incomingCall);
      console.log('  - callState === ringing:', callState === 'ringing');
    }
  }, [shouldNavigateToIncomingCall, incomingCall, callState, router]);

  const value: IncomingCallContextType = {
    incomingCall,
    callState,
    isPolling,
    error,
    answerCall,
    rejectCall,
    endCall,
    clearError,
  };

  return <IncomingCallContext.Provider value={value}>{children}</IncomingCallContext.Provider>;
};

export const useIncomingCall = (): IncomingCallContextType => {
  const context = useContext(IncomingCallContext);
  if (context === undefined) {
    throw new Error('useIncomingCall must be used within an IncomingCallProvider');
  }
  return context;
};

/**
 * useMessagePolling Hook
 *
 * Manages message polling for a specific incident.
 * Pattern: Following useDispatchPolling.ts
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Message } from '@/src/types/message.types';
import * as messageService from '@/src/services/message.service';

const POLL_INTERVAL = 2000; // 3 seconds (as per requirements)

export interface UseMessagePollingReturn {
  messages: Message[];
  isPolling: boolean;
  isSending: boolean;
  error: string | null;
  startPolling: (incidentId: number) => void;
  stopPolling: () => void;
  sendMessage: (incidentId: number, text?: string, imageUri?: string) => Promise<void>;
  markMessagesAsRead: (messageIds: number[]) => Promise<void>;
  refreshMessages: () => Promise<void>;
  clearError: () => void;
}

export const useMessagePolling = (): UseMessagePollingReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const incidentIdRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Fetch messages from API
   */
  const refreshMessages = useCallback(async () => {
    if (!incidentIdRef.current) return;

    try {
      const response = await messageService.getMessages(incidentIdRef.current);
      setMessages(response.messages);
      setError(null);
    } catch (err: any) {
      console.error('[useMessagePolling] Refresh error:', err);
      setError('Failed to load messages. Please check your connection.');
    }
  }, []);

  /**
   * Start polling for messages
   */
  const startPolling = useCallback(
    (incidentId: number) => {
      if (isPolling && incidentIdRef.current === incidentId) {
        console.log('[useMessagePolling] Already polling for incident:', incidentId);
        return;
      }

      console.log('[useMessagePolling] Starting message polling for incident:', incidentId);
      incidentIdRef.current = incidentId;
      setIsPolling(true);

      // Initial fetch
      refreshMessages();

      // Set up interval
      intervalRef.current = setInterval(() => {
        refreshMessages();
      }, POLL_INTERVAL);
    },
    [isPolling, refreshMessages]
  );

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (!isPolling) {
      console.log('[useMessagePolling] Not currently polling');
      return;
    }

    console.log('[useMessagePolling] Stopping message polling');
    setIsPolling(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    incidentIdRef.current = null;
    setMessages([]);
  }, [isPolling]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(
    async (incidentId: number, text?: string, imageUri?: string) => {
      if (!text && !imageUri) {
        throw new Error('Message must contain text or image');
      }

      setIsSending(true);
      try {
        const request: any = {
          incident_id: incidentId,
        };

        if (text) {
          request.message = text;
        }

        if (imageUri) {
          const filename = imageUri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          request.image = {
            uri: imageUri,
            name: filename,
            type,
          };
        }

        const newMessage = await messageService.sendMessage(request);

        // Optimistically add message to list
        setMessages((prev) => [...prev, newMessage]);
        setError(null);

        // Refresh to ensure consistency
        await refreshMessages();
      } catch (err: any) {
        console.error('[useMessagePolling] Send message error:', err);
        setError('Failed to send message. Please try again.');
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [refreshMessages]
  );

  /**
   * Mark multiple messages as read
   */
  const markMessagesAsRead = useCallback(async (messageIds: number[]) => {
    try {
      await Promise.all(
        messageIds.map((id) => messageService.markAsRead(id))
      );

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
        )
      );
    } catch (err: any) {
      console.error('[useMessagePolling] Mark as read error:', err);
      // Don't throw - this is a background operation
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle app state changes (pause polling when backgrounded)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - resume polling if needed
        if (isPolling && incidentIdRef.current) {
          console.log('[useMessagePolling] App foregrounded - resuming polling');
          refreshMessages();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background - pause polling
        if (intervalRef.current) {
          console.log('[useMessagePolling] App backgrounded - pausing polling');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isPolling, refreshMessages]);

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

  return {
    messages,
    isPolling,
    isSending,
    error,
    startPolling,
    stopPolling,
    sendMessage,
    markMessagesAsRead,
    refreshMessages,
    clearError,
  };
};

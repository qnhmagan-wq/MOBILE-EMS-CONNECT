import { useState, useEffect, useRef } from 'react';
import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} from 'react-native-agora';
import { Platform, PermissionsAndroid } from 'react-native';
import ENV from '@/src/config/env';
import { CallState } from '@/src/types/call.types';
import { startCall as startCallAPI, endCall as endCallAPI } from '@/src/services/call.service';

interface UseAgoraCallReturn {
  callState: CallState;
  startCall: (incidentId?: number) => Promise<{ success: boolean; error?: string }>;
  endCall: () => Promise<{ success: boolean; error?: string }>;
  toggleMute: () => Promise<void>;
}

export const useAgoraCall = (): UseAgoraCallReturn => {
  const agoraEngine = useRef<IRtcEngine | null>(null);
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isConnecting: false,
    isWaitingForAnswer: false,
    isMuted: false,
    callDuration: 0,
  });
  const [currentCallId, setCurrentCallId] = useState<number | null>(null);
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize Agora Engine
  useEffect(() => {
    const init = async () => {
      try {
        // Request microphone permission for Android
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('Microphone permission denied');
            return;
          }
        }

        // Create Agora engine
        const engine = createAgoraRtcEngine();
        agoraEngine.current = engine;

        // Initialize with App ID
        engine.initialize({
          appId: ENV.AGORA_APP_ID,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });

        // Register event handlers
        engine.registerEventHandler({
          onJoinChannelSuccess: () => {
            console.log('✅ Successfully joined Agora channel - waiting for admin to answer');
            // User has joined, but waiting for admin to answer
            setCallState(prev => ({ 
              ...prev, 
              isConnecting: false, 
              isWaitingForAnswer: true,
              isInCall: false 
            }));
          },
          onUserJoined: (connection, remoteUid) => {
            console.log(`👤 Admin answered the call (UID: ${remoteUid})`);
            // Admin joined - call is now connected!
            setCallState(prev => ({ 
              ...prev, 
              isWaitingForAnswer: false, 
              isInCall: true 
            }));
            startDurationTimer();
          },
          onUserOffline: (connection, remoteUid) => {
            console.log(`👤 Admin left the call (UID: ${remoteUid})`);
            // Admin left - you might want to end the call or show a message
          },
          onError: (err) => {
            console.error('❌ Agora error:', err);
          },
        });

        // Enable audio
        engine.enableAudio();
      } catch (error) {
        console.error('Failed to initialize Agora engine:', error);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      if (agoraEngine.current) {
        agoraEngine.current.leaveChannel();
        agoraEngine.current.release();
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  // Start call duration timer
  const startDurationTimer = () => {
    durationInterval.current = setInterval(() => {
      setCallState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }));
    }, 1000);
  };

  // Start emergency call
  const startCall = async (incidentId?: number) => {
    try {
      setCallState(prev => ({ ...prev, isConnecting: true }));

      // Call backend API to start call
      const data = await startCallAPI({
        incident_id: incidentId || null,
      });

      const { call, channel_name } = data;

      setCurrentCallId(call.id);

      // Join Agora channel
      if (agoraEngine.current) {
        await agoraEngine.current.joinChannel(
          '', // token (empty for App ID only mode)
          channel_name,
          0, // uid (0 for auto-assign)
          {
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          }
        );
      }

      return { success: true };
    } catch (error: any) {
      console.error('Failed to start call:', error);
      setCallState(prev => ({ ...prev, isConnecting: false }));
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to start call'
      };
    }
  };

  // End call
  const endCall = async () => {
    try {
      if (!currentCallId) {
        throw new Error('No active call to end');
      }

      // Leave Agora channel
      if (agoraEngine.current) {
        await agoraEngine.current.leaveChannel();
      }

      // Call backend API to end call
      await endCallAPI({
        call_id: currentCallId,
      });

      // Reset state
      setCallState({
        isInCall: false,
        isConnecting: false,
        isWaitingForAnswer: false,
        isMuted: false,
        callDuration: 0,
      });
      setCurrentCallId(null);

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Failed to end call:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to end call'
      };
    }
  };

  // Toggle mute
  const toggleMute = async () => {
    if (agoraEngine.current) {
      const newMuteState = !callState.isMuted;
      await agoraEngine.current.muteLocalAudioStream(newMuteState);
      setCallState(prev => ({ ...prev, isMuted: newMuteState }));
    }
  };

  return {
    callState,
    startCall,
    endCall,
    toggleMute,
  };
};

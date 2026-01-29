import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIncomingCall } from '@/src/contexts/IncomingCallContext';
import { useAgoraCall } from '@/src/hooks/useAgoraCall';
import { Colors, Spacing, FontSizes } from '@/src/config/theme';
import {
  scale,
  scaleFontSize,
  scaleSpacing,
} from '@/src/utils/responsive';

export default function ActiveIncomingCallScreen() {
  const router = useRouter();
  const { incomingCall, endCall } = useIncomingCall();
  const { callState, toggleMute, endCall: agoraEndCall } = useAgoraCall();

  const handleEndCall = async () => {
    try {
      // Leave Agora channel
      await agoraEndCall();

      // End call on backend
      await endCall();

      // Navigate back
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/community/home');
      }
    } catch (error: any) {
      console.error('[ActiveIncomingCall] End call error:', error);
      Alert.alert('Error', 'Failed to end call properly, but call has been terminated.');
      router.replace('/(tabs)/community/home');
    }
  };

  // Format call duration (seconds to MM:SS)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!incomingCall) {
    // No incoming call, redirect to home
    router.replace('/(tabs)/community/home');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Call with Admin</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Call Status */}
      <View style={styles.statusContainer}>
        {callState.isInCall ? (
          <>
            <View style={styles.activeCallContainer}>
              <Ionicons name="call" size={scale(64)} color="#FFFFFF" />
            </View>
            <Text style={styles.adminName}>{incomingCall.admin_caller.name}</Text>
            <Text style={styles.durationText}>{formatDuration(callState.callDuration)}</Text>
            <Text style={styles.subText}>Emergency Services</Text>
          </>
        ) : (
          <>
            <View style={styles.connectingContainer}>
              <View style={styles.pulseOuter} />
              <View style={styles.pulseMiddle} />
              <View style={styles.pulseInner} />
              <Ionicons name="call" size={scale(48)} color="#FFFFFF" style={styles.callIcon} />
            </View>
            <Text style={styles.statusText}>Connecting...</Text>
            <Text style={styles.subText}>Please wait while we connect you</Text>
          </>
        )}
      </View>

      {/* Call Controls */}
      <View style={styles.controls}>
        {callState.isInCall && (
          <TouchableOpacity
            style={[styles.button, styles.muteButton, callState.isMuted && styles.muteButtonActive]}
            onPress={toggleMute}
          >
            <Ionicons
              name={callState.isMuted ? 'mic-off' : 'mic'}
              size={scale(28)}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>
              {callState.isMuted ? 'Unmute' : 'Mute'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.endButton]}
          onPress={handleEndCall}
        >
          <Ionicons
            name="call"
            size={scale(28)}
            color="#FFFFFF"
            style={[styles.buttonIcon, styles.endCallIcon]}
          />
          <Text style={styles.buttonText}>End Call</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const activeCallSize = scale(140);
const connectingSize = scale(160);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSpacing(20),
    paddingVertical: scaleSpacing(16),
  },
  headerTitle: {
    fontSize: scaleFontSize(20),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: scale(40),
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleSpacing(40),
  },
  activeCallContainer: {
    width: activeCallSize,
    height: activeCallSize,
    borderRadius: activeCallSize / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(30),
  },
  connectingContainer: {
    width: connectingSize,
    height: connectingSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(40),
  },
  pulseOuter: {
    position: 'absolute',
    width: connectingSize,
    height: connectingSize,
    borderRadius: connectingSize / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pulseMiddle: {
    position: 'absolute',
    width: connectingSize * 0.75,
    height: connectingSize * 0.75,
    borderRadius: (connectingSize * 0.75) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pulseInner: {
    width: connectingSize * 0.5,
    height: connectingSize * 0.5,
    borderRadius: (connectingSize * 0.5) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    position: 'absolute',
  },
  adminName: {
    fontSize: scaleFontSize(FontSizes.xxl),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scaleSpacing(10),
    textAlign: 'center',
  },
  statusText: {
    fontSize: scaleFontSize(28),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: scaleSpacing(10),
  },
  durationText: {
    fontSize: scaleFontSize(56),
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: scaleSpacing(20),
    fontVariant: ['tabular-nums'],
  },
  subText: {
    fontSize: scaleFontSize(16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: scaleFontSize(24),
  },
  controls: {
    padding: scaleSpacing(30),
    gap: scaleSpacing(15),
  },
  button: {
    flexDirection: 'row',
    padding: scaleSpacing(20),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSpacing(12),
  },
  buttonIcon: {
    marginRight: scaleSpacing(4),
  },
  muteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  muteButtonActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  endButton: {
    backgroundColor: '#EF4444',
  },
  endCallIcon: {
    transform: [{ rotate: '135deg' }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: scaleFontSize(18),
    fontWeight: '700',
  },
});

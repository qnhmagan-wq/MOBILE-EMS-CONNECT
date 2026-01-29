import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
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
  getResponsiveButtonSize,
} from '@/src/utils/responsive';

export default function IncomingCallScreen() {
  const router = useRouter();
  const { incomingCall, answerCall, rejectCall } = useIncomingCall();
  const { answerCall: agoraAnswerCall } = useAgoraCall();

  // Debug: Log screen mount/unmount
  useEffect(() => {
    console.log('[IncomingCallScreen] ✅✅✅ SCREEN MOUNTED! ✅✅✅');
    console.log('[IncomingCallScreen] Has incoming call:', !!incomingCall);
    console.log('[IncomingCallScreen] Incoming call data:', incomingCall);
    return () => {
      console.log('[IncomingCallScreen] SCREEN UNMOUNTED');
    };
  }, []);

  // Auto-dismiss if call is canceled
  useEffect(() => {
    if (!incomingCall) {
      if (router.canGoBack()) {
        router.back();
      }
    }
  }, [incomingCall, router]);

  const handleAnswer = async () => {
    if (!incomingCall) return;

    // Answer call via context (calls backend API)
    const result = await answerCall();

    if (result.success && result.channelName) {
      // Join Agora channel
      const agoraResult = await agoraAnswerCall(incomingCall.id, result.channelName);

      if (agoraResult.success) {
        // Navigate to active call screen
        router.replace('/(tabs)/community/active-incoming-call');
      } else {
        // Failed to join Agora - error already shown by context
        console.error('[IncomingCall] Agora join failed:', agoraResult.error);
      }
    }
  };

  const handleReject = async () => {
    await rejectCall();
    if (router.canGoBack()) {
      router.back();
    }
  };

  if (!incomingCall) {
    // Show loading state instead of null (prevents white flash)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading call details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getIncidentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      medical: 'Medical Emergency',
      fire: 'Fire Emergency',
      accident: 'Accident',
      crime: 'Crime',
      natural_disaster: 'Natural Disaster',
      other: 'Emergency',
    };
    return labels[type] || type.toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Pulsing background effect */}
      <View style={styles.pulseOuter} />

      {/* Admin caller info */}
      <View style={styles.callerInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={scale(120)} color="rgba(255, 255, 255, 0.9)" />
        </View>
        <Text style={styles.callerName}>{incomingCall.admin_caller.name}</Text>
        <Text style={styles.callerRole}>Emergency Services</Text>
      </View>

      {/* Incident context */}
      <View style={styles.contextInfo}>
        <Text style={styles.contextLabel}>Calling about</Text>
        <Text style={styles.incidentType}>
          {getIncidentTypeLabel(incomingCall.incident.type)}
        </Text>
        <Text style={styles.incidentId}>Incident #{incomingCall.incident_id}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.answerButton]}
          onPress={handleAnswer}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={scale(32)} color="#FFFFFF" />
          <Text style={styles.buttonText}>Answer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleReject}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle" size={scale(32)} color="#FFFFFF" />
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const pulseOuterSize = scale(300);
const actionButtonSize = getResponsiveButtonSize(120);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scaleSpacing(Spacing.xl),
  },
  pulseOuter: {
    position: 'absolute',
    width: pulseOuterSize,
    height: pulseOuterSize,
    borderRadius: pulseOuterSize / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '20%',
  },
  callerInfo: {
    alignItems: 'center',
    marginTop: '25%',
  },
  avatarContainer: {
    marginBottom: scaleSpacing(Spacing.lg),
  },
  callerName: {
    fontSize: scaleFontSize(FontSizes.xxxl),
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: scaleSpacing(Spacing.md),
    textAlign: 'center',
  },
  callerRole: {
    fontSize: scaleFontSize(FontSizes.md),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: scaleSpacing(Spacing.xs),
  },
  contextInfo: {
    alignItems: 'center',
    marginBottom: scaleSpacing(Spacing.xl),
  },
  contextLabel: {
    fontSize: scaleFontSize(FontSizes.sm),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: scaleSpacing(Spacing.xs),
  },
  incidentType: {
    fontSize: scaleFontSize(FontSizes.xl),
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: scaleSpacing(Spacing.xs),
    textAlign: 'center',
  },
  incidentId: {
    fontSize: scaleFontSize(FontSizes.md),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: scaleSpacing(Spacing.xs),
  },
  actions: {
    flexDirection: 'row',
    gap: scaleSpacing(Spacing.xl),
    marginBottom: scaleSpacing(Spacing.xxl),
  },
  actionButton: {
    width: actionButtonSize,
    height: actionButtonSize,
    borderRadius: actionButtonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  answerButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.danger,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: scaleFontSize(FontSizes.md),
    fontWeight: '600',
    marginTop: scaleSpacing(Spacing.xs),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: scaleFontSize(FontSizes.md),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: scaleSpacing(Spacing.md),
  },
});

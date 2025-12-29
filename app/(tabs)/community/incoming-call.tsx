import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useIncomingCall } from '@/src/contexts/IncomingCallContext';
import { useAgoraCall } from '@/src/hooks/useAgoraCall';
import { Colors, Spacing, FontSizes } from '@/src/config/theme';

export default function IncomingCallScreen() {
  const router = useRouter();
  const { incomingCall, answerCall, rejectCall } = useIncomingCall();
  const { answerCall: agoraAnswerCall } = useAgoraCall();

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
    return null;
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
          <Ionicons name="person-circle" size={120} color="rgba(255, 255, 255, 0.9)" />
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
          <Ionicons name="call" size={32} color="#FFFFFF" />
          <Text style={styles.buttonText}>Answer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleReject}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle" size={32} color="#FFFFFF" />
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  pulseOuter: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '20%',
  },
  callerInfo: {
    alignItems: 'center',
    marginTop: '25%',
  },
  avatarContainer: {
    marginBottom: Spacing.lg,
  },
  callerName: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  callerRole: {
    fontSize: FontSizes.md,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.xs,
  },
  contextInfo: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  contextLabel: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
  },
  incidentType: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  incidentId: {
    fontSize: FontSizes.md,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  actionButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
});

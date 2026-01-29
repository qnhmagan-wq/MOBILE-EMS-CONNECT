import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAgoraCall } from '@/src/hooks/useAgoraCall';
import { useIncidents } from '@/src/hooks/useIncidents';
import { Colors } from '@/src/config/theme';
import { IncidentType } from '@/src/types/incident.types';
import {
  scale,
  scaleFontSize,
  scaleSpacing,
} from '@/src/utils/responsive';

export default function EmergencyCallScreen() {
  const router = useRouter();
  const { callState, startCall, endCall, toggleMute } = useAgoraCall();
  const { createIncident, isLoading: isCreatingIncident, error: incidentError } = useIncidents();
  const [currentIncidentId, setCurrentIncidentId] = useState<number | null>(null);
  const [isStartingEmergency, setIsStartingEmergency] = useState(false);

  const handleStartCall = async (emergencyType: IncidentType = 'medical') => {
    setIsStartingEmergency(true);
    
    try {
      // Step 1: Create incident with location
      console.log('[Emergency] Step 1: Creating incident...');
      const incident = await createIncident(emergencyType, 'Emergency call initiated');
      
      if (!incident) {
        // Get the actual error from the hook
        const errorMessage = incidentError || 'Failed to report emergency. Please check your location permissions and try again.';
        console.error('[Emergency] Incident creation failed:', errorMessage);
        Alert.alert(
          'Emergency Report Failed', 
          errorMessage,
          [{ text: 'OK' }]
        );
        setIsStartingEmergency(false);
        return;
      }
      
      console.log('[Emergency] Step 2: Incident created successfully:', incident.id);
      setCurrentIncidentId(incident.id);
      
      // Step 3: Start the call with incident_id
      console.log('[Emergency] Step 3: Starting call with incident_id:', incident.id);
      const result = await startCall(incident.id);
      
      if (!result.success) {
        console.error('[Emergency] Call start failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to start call');
      } else {
        console.log('[Emergency] Call started successfully');
      }
    } catch (error: any) {
      console.error('[Emergency] Unexpected error:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to start emergency call. Please try again.'
      );
    } finally {
      setIsStartingEmergency(false);
    }
  };

  const handleEndCall = async () => {
    const result = await endCall();
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to end call');
    } else {
      // Navigate back to home after ending call
      router.back();
    }
  };

  // Format call duration (seconds to MM:SS)
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={scale(24)} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Call</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Call Status */}
      <View style={styles.statusContainer}>
        {isStartingEmergency && !callState.isConnecting && (
          <>
            <View style={styles.pulseContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
            <Text style={styles.statusText}>Getting Location...</Text>
            <Text style={styles.subText}>Reporting your emergency and location</Text>
          </>
        )}
        {callState.isConnecting && (
          <>
            <View style={styles.pulseContainer}>
              <View style={styles.pulseOuter} />
              <View style={styles.pulseMiddle} />
              <View style={styles.pulseInner} />
              <Ionicons name="call" size={scale(48)} color="#FFFFFF" style={styles.callIcon} />
            </View>
            <Text style={styles.statusText}>Connecting...</Text>
            <Text style={styles.subText}>Please wait while we connect you to emergency services</Text>
          </>
        )}
        {callState.isWaitingForAnswer && (
          <>
            <View style={styles.pulseContainer}>
              <View style={[styles.pulseOuter, styles.pulseAnimated]} />
              <View style={[styles.pulseMiddle, styles.pulseAnimated]} />
              <View style={styles.pulseInner} />
              <Ionicons name="call" size={scale(48)} color="#FFFFFF" style={styles.callIcon} />
            </View>
            <Text style={styles.statusText}>Calling...</Text>
            <Text style={styles.subText}>Waiting for emergency dispatcher to answer</Text>
          </>
        )}
        {callState.isInCall && (
          <>
            <View style={styles.activeCallContainer}>
              <Ionicons name="call" size={scale(64)} color="#FFFFFF" />
            </View>
            <Text style={styles.statusText}>In Call</Text>
            <Text style={styles.durationText}>{formatDuration(callState.callDuration)}</Text>
            <Text style={styles.subText}>Emergency Dispatcher</Text>
          </>
        )}
        {!callState.isInCall && !callState.isConnecting && !callState.isWaitingForAnswer && !isStartingEmergency && (
          <>
            <View style={styles.readyContainer}>
              <Ionicons name="call-outline" size={scale(64)} color="#FFFFFF" />
            </View>
            <Text style={styles.statusText}>Ready</Text>
            <Text style={styles.subText}>Tap the button below to call emergency services</Text>
          </>
        )}
      </View>

      {/* Call Controls */}
      <View style={styles.controls}>
        {!callState.isInCall && !callState.isConnecting && !callState.isWaitingForAnswer && !isStartingEmergency && (
          <TouchableOpacity
            style={[styles.button, styles.callButton]}
            onPress={() => handleStartCall('medical')}
          >
            <Ionicons name="call" size={scale(32)} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Emergency Call</Text>
          </TouchableOpacity>
        )}

        {isStartingEmergency && !callState.isConnecting && (
          <View style={[styles.button, styles.disabledButton]}>
            <ActivityIndicator color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Starting Emergency...</Text>
          </View>
        )}

        {callState.isWaitingForAnswer && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleEndCall}
          >
            <Ionicons name="close-circle" size={scale(28)} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Cancel Call</Text>
          </TouchableOpacity>
        )}

        {callState.isInCall && (
          <>
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

            <TouchableOpacity
              style={[styles.button, styles.endButton]}
              onPress={handleEndCall}
            >
              <Ionicons name="call" size={scale(28)} color="#FFFFFF" style={[styles.buttonIcon, styles.endCallIcon]} />
              <Text style={styles.buttonText}>End Call</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const pulseSize = scale(160);
const activeCallSize = scale(140);

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
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
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
  pulseContainer: {
    width: pulseSize,
    height: pulseSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(40),
  },
  pulseOuter: {
    position: 'absolute',
    width: pulseSize,
    height: pulseSize,
    borderRadius: pulseSize / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pulseMiddle: {
    position: 'absolute',
    width: pulseSize * 0.75,
    height: pulseSize * 0.75,
    borderRadius: (pulseSize * 0.75) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pulseInner: {
    width: pulseSize * 0.5,
    height: pulseSize * 0.5,
    borderRadius: (pulseSize * 0.5) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    position: 'absolute',
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
  readyContainer: {
    width: activeCallSize,
    height: activeCallSize,
    borderRadius: activeCallSize / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSpacing(30),
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
  callButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#6B7280',
  },
  cancelButton: {
    backgroundColor: '#F59E0B',
  },
  pulseAnimated: {
    opacity: 0.6,
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

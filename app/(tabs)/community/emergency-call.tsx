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
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
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
              <Ionicons name="call" size={48} color="#FFFFFF" style={styles.callIcon} />
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
              <Ionicons name="call" size={48} color="#FFFFFF" style={styles.callIcon} />
            </View>
            <Text style={styles.statusText}>Calling...</Text>
            <Text style={styles.subText}>Waiting for emergency dispatcher to answer</Text>
          </>
        )}
        {callState.isInCall && (
          <>
            <View style={styles.activeCallContainer}>
              <Ionicons name="call" size={64} color="#FFFFFF" />
            </View>
            <Text style={styles.statusText}>In Call</Text>
            <Text style={styles.durationText}>{formatDuration(callState.callDuration)}</Text>
            <Text style={styles.subText}>Emergency Dispatcher</Text>
          </>
        )}
        {!callState.isInCall && !callState.isConnecting && !callState.isWaitingForAnswer && !isStartingEmergency && (
          <>
            <View style={styles.readyContainer}>
              <Ionicons name="call-outline" size={64} color="#FFFFFF" />
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
            <Ionicons name="call" size={32} color="#FFFFFF" style={styles.buttonIcon} />
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
            <Ionicons name="close-circle" size={28} color="#FFFFFF" style={styles.buttonIcon} />
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
                size={28}
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
              <Ionicons name="call" size={28} color="#FFFFFF" style={[styles.buttonIcon, styles.endCallIcon]} />
              <Text style={styles.buttonText}>End Call</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  pulseContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  pulseOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pulseMiddle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pulseInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    position: 'absolute',
  },
  activeCallContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  readyContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  durationText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 20,
    fontVariant: ['tabular-nums'],
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  controls: {
    padding: 30,
    gap: 15,
  },
  button: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonIcon: {
    marginRight: 4,
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
    fontSize: 18,
    fontWeight: '700',
  },
});

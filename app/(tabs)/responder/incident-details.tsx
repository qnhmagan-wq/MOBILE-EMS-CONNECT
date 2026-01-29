import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { useDispatch } from "@/src/contexts/DispatchContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import { Incident } from "@/src/types/incident.types";
import { Dispatch, DispatchStatus, PreArrivalData } from "@/src/types/dispatch.types";
import { DispatchStatusBadge } from "@/components/DispatchStatusBadge";
import TimelineItem from "@/components/TimelineItem";
import { getElapsedTime } from "@/src/utils/time";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PreArrivalModal } from "@/src/components/PreArrivalModal";

export default function ResponderIncidentDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const incidentId = params.id ? parseInt(params.id as string) : null;
  const dispatchId = params.dispatchId ? parseInt(params.dispatchId as string) : null;
  const { user } = useAuth();
  const { dispatches, updateDispatchStatus: updateStatus } = useDispatch();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPreArrivalModal, setShowPreArrivalModal] = useState(false);
  const [preArrivalData, setPreArrivalData] = useState<PreArrivalData[]>([]);
  const isMounted = useRef(true); // Track if component is mounted

  // Helper to check if pre-arrival form should be available
  const canShowPreArrival = dispatch?.status === 'en_route' || dispatch?.status === 'arrived';

  useEffect(() => {
    // Get incident data from dispatch context (no API call needed)
    // Dispatches are already fetched by DispatchContext polling
    if (dispatchId) {
      const found = dispatches.find(d => d.id === dispatchId);
      if (found?.incident) {
        setDispatch(found);

        // Convert dispatch.incident to Incident type
        const incidentData: Incident = {
          id: found.incident.id,
          type: found.incident.type as any,
          status: found.incident.status as any,
          latitude: found.incident.latitude,
          longitude: found.incident.longitude,
          address: found.incident.address,
          description: found.incident.description,
          created_at: found.incident.created_at,
          updated_at: found.incident.updated_at,
          reporter_id: found.incident.reporter_id,
        };
        setIncident(incidentData);
      } else {
        console.warn('[IncidentDetails] Dispatch found but no incident data:', dispatchId);
      }
    }
    setIsLoading(false);
  }, [dispatchId, dispatches]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getAvailableActions = (currentStatus: DispatchStatus) => {
    switch (currentStatus) {
      case 'assigned':
        return [
          { status: 'accepted' as DispatchStatus, label: 'Accept Dispatch', icon: 'checkmark-circle', color: '#10B981' },
          { status: 'declined' as DispatchStatus, label: 'Decline', icon: 'close-circle', color: '#EF4444' },
        ];
      case 'accepted':
        return [
          { status: 'en_route' as DispatchStatus, label: 'On My Way', icon: 'car', color: '#F59E0B' },
        ];
      case 'en_route':
        return [
          { status: 'arrived' as DispatchStatus, label: "I've Arrived", icon: 'location', color: '#8B5CF6' },
        ];
      case 'arrived':
        return [
          { status: 'transporting_to_hospital' as DispatchStatus, label: 'Going to Hospital', icon: 'medical', color: '#3B82F6', isPrimary: true },
          { status: 'completed' as DispatchStatus, label: 'Complete Without Transport', icon: 'checkmark-done-circle', color: '#10B981', isSecondary: true },
        ];
      case 'transporting_to_hospital':
        return [
          { status: 'completed' as DispatchStatus, label: 'Complete at Hospital', icon: 'checkmark-done-circle', color: '#10B981' },
        ];
      default:
        return [];
    }
  };

  const handleGoingToHospital = async () => {
    if (!dispatch) return;

    setIsUpdating(true);
    try {
      const response = await updateStatus(dispatch.id, 'transporting_to_hospital');

      // Check if hospital route data was returned
      if (response?.hospital_route) {
        // Navigate to hospital navigation screen
        if (isMounted.current) {
          router.push(
            `/(tabs)/responder/hospital-navigation?dispatchId=${dispatch.id}`
          );
        }
      } else {
        // Route data missing (shouldn't happen, but handle gracefully)
        Alert.alert('Error', 'Hospital route information unavailable. Please try again.');
      }
    } catch (error: any) {
      handleHospitalTransportError(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleHospitalTransportError = (error: any) => {
    const errorCode = error.response?.data?.error_code;

    switch (errorCode) {
      case 'NO_HOSPITAL_ASSIGNED':
        Alert.alert(
          'No Hospital Assigned',
          'Please contact your administrator to assign a hospital to your profile.',
          [{ text: 'OK' }]
        );
        break;

      case 'HOSPITAL_INACTIVE':
        Alert.alert(
          'Hospital Unavailable',
          'The assigned hospital is currently inactive. Please contact dispatch.',
          [{ text: 'OK' }]
        );
        break;

      case 'HOSPITAL_NO_LOCATION':
        Alert.alert(
          'Location Unavailable',
          'Hospital location data is missing. Please contact dispatch.',
          [{ text: 'OK' }]
        );
        break;

      case 'INVALID_STATUS_TRANSITION':
        Alert.alert(
          'Invalid Action',
          'You must arrive at the incident before transporting to hospital.',
          [{ text: 'OK' }]
        );
        break;

      default:
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to start hospital transport. Please try again.',
          [{ text: 'OK' }]
        );
    }
  };

  const handleStatusUpdate = async (newStatus: DispatchStatus) => {
    if (!dispatch) return;

    // Special handler for hospital transport
    if (newStatus === 'transporting_to_hospital') {
      handleGoingToHospital();
      return;
    }

    Alert.alert(
      'Update Dispatch Status',
      `Are you sure you want to update status to ${newStatus.replace('_', ' ').toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await updateStatus(dispatch.id, newStatus);

              // **FIX: Sequential status updates - Accept then En Route before navigation**
              // Backend requires: assigned → accepted → en_route (must be sequential)
              if (newStatus === 'accepted') {
                console.log('[Incident Details] Status updated to accepted, waiting for backend to commit...');

                // Add 500ms delay to ensure backend commits the accepted status
                // This prevents race condition where en_route is sent before accepted is committed
                await new Promise(resolve => setTimeout(resolve, 500));

                try {
                  // Update to en_route AFTER delay to avoid race condition
                  await updateStatus(dispatch.id, 'en_route');
                  console.log('[Incident Details] Status updated to en_route successfully');
                } catch (enRouteError: any) {
                  console.error('[Incident Details] Failed to update to en_route:', enRouteError);
                  // Still navigate but without autoStart - let user manually trigger en_route
                  Alert.alert(
                    'Partial Success',
                    'Dispatch accepted but failed to set en_route status. You can update it manually on the map screen.'
                  );
                }

                // Navigate to route-map (without autoStart since we already updated)
                if (isMounted.current && incident) {
                  // Serialize incident data for safe URL transmission
                  const incidentData = encodeURIComponent(JSON.stringify({
                    id: incident.id,
                    type: incident.type,
                    latitude: incident.latitude,
                    longitude: incident.longitude,
                    address: incident.address,
                    description: incident.description,
                  }));
                  router.push(
                    `/(tabs)/responder/route-map?id=${incident.id}&dispatchId=${dispatch.id}&incidentData=${incidentData}`
                  );
                }
              }
              // For completed status: navigate after user dismisses alert
              // This ensures all state updates finish before navigation
              else if (newStatus === 'completed') {
                Alert.alert(
                  'Success',
                  'Incident completed successfully!',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Only navigate if component still mounted
                        if (isMounted.current) {
                          router.back();
                        }
                      },
                    },
                  ]
                );
              } else {
                // For other statuses, just show success message
                Alert.alert('Success', `Status updated to ${newStatus.replace('_', ' ')}`);
              }
            } catch (error: any) {
              console.error('[IncidentDetails] Status update error:', error);
              Alert.alert('Error', 'Failed to update status. Please try again.');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
      </ErrorBoundary>
    );
  }

  if (!incident) {
    return (
      <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Incident not found</Text>
        </View>
      </SafeAreaView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <SafeAreaView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Dispatch Status Badge */}
        {dispatch && (
          <View style={styles.statusContainer}>
            <View>
              <Text style={styles.statusLabel}>Dispatch Status:</Text>
              {/* Elapsed time indicator */}
              {dispatch.en_route_at && dispatch.status === 'en_route' && (
                <Text style={styles.elapsedTime}>
                  En route for {getElapsedTime(dispatch.en_route_at)}
                </Text>
              )}
              {dispatch.assigned_at && dispatch.status === 'assigned' && (
                <Text style={styles.elapsedTime}>
                  Assigned {getElapsedTime(dispatch.assigned_at)} ago
                </Text>
              )}
              {dispatch.arrived_at && dispatch.status === 'arrived' && (
                <Text style={styles.elapsedTime}>
                  At scene for {getElapsedTime(dispatch.arrived_at)}
                </Text>
              )}
              {dispatch.transporting_to_hospital_at && dispatch.status === 'transporting_to_hospital' && (
                <Text style={styles.elapsedTime}>
                  Transporting for {getElapsedTime(dispatch.transporting_to_hospital_at)}
                </Text>
              )}
            </View>
            <DispatchStatusBadge status={dispatch.status} size="large" />
          </View>
        )}

        {/* Incident Type */}
        <View style={styles.incidentCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="alert-circle" size={32} color={Colors.textWhite} />
            <Text style={styles.incidentType}>
              {incident.type.charAt(0).toUpperCase() + incident.type.slice(1).replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.incidentCard}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={20} color={Colors.textWhite} />
            <Text style={styles.locationText}>{incident.address}</Text>
          </View>
        </View>

        {/* Distance and ETA */}
        {dispatch?.distance_text && (
          <View style={styles.incidentCard}>
            <View style={styles.distanceInfo}>
              <Ionicons name="navigate" size={20} color={Colors.textWhite} />
              <Text style={styles.distanceText}>
                {dispatch.distance_text} • {dispatch.duration_text || 'Calculating...'}
              </Text>
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.incidentCard}>
          <Text style={styles.descriptionLabel}>Description:</Text>
          <Text style={styles.descriptionText}>{incident.description}</Text>
        </View>

        {/* Reporter Info (if available) */}
        {dispatch?.incident?.reporter && (
          <View style={styles.incidentCard}>
            <Text style={styles.descriptionLabel}>Reporter Contact:</Text>
            <Text style={styles.descriptionText}>
              {dispatch.incident.reporter.name}
            </Text>
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={() => {
                const phone = dispatch.incident.reporter.phone_number;
                Linking.openURL(`tel:${phone}`);
              }}
            >
              <Ionicons name="call" size={20} color="#10B981" />
              <Text style={styles.phoneNumber}>
                {dispatch.incident.reporter.phone_number}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Timeline Section */}
        {dispatch && (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Response Timeline</Text>

            <TimelineItem
              label="Incident Reported"
              time={incident.created_at}
              icon="alert-circle"
              color="#EF4444"
            />

            <TimelineItem
              label="Assigned to You"
              time={dispatch.assigned_at}
              icon="person-add"
              color="#F59E0B"
            />

            <TimelineItem
              label="Dispatch Accepted"
              time={dispatch.accepted_at}
              icon="checkmark-circle"
              color="#3B82F6"
            />

            <TimelineItem
              label="En Route"
              time={dispatch.en_route_at}
              icon="navigate"
              color="#F59E0B"
            />

            <TimelineItem
              label="Arrived at Scene"
              time={dispatch.arrived_at}
              icon="location"
              color="#8B5CF6"
            />

            <TimelineItem
              label="Transporting to Hospital"
              time={dispatch.transporting_to_hospital_at}
              icon="medical"
              color="#3B82F6"
            />

            <TimelineItem
              label="Incident Completed"
              time={dispatch.completed_at}
              icon="checkmark-done"
              color="#10B981"
              isLast={true}
            />
          </View>
        )}

        {/* Dispatch Status Action Buttons */}
        {dispatch && getAvailableActions(dispatch.status).length > 0 && (
          <View style={styles.statusActionsContainer}>
            <Text style={styles.actionsTitle}>Update Status</Text>
            {getAvailableActions(dispatch.status).map((action: any) => (
              <TouchableOpacity
                key={action.status}
                style={[
                  styles.statusActionButton,
                  { backgroundColor: action.color },
                  action.isSecondary && styles.secondaryButton
                ]}
                onPress={() => handleStatusUpdate(action.status)}
                disabled={isUpdating}
              >
                <Ionicons name={action.icon as any} size={24} color={action.isSecondary ? action.color : Colors.textWhite} />
                <Text style={[styles.statusActionText, action.isSecondary && styles.secondaryButtonText]}>{action.label}</Text>
                {isUpdating && <ActivityIndicator color={action.isSecondary ? action.color : Colors.textWhite} size="small" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Other Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Pre-Arrival Button - only show when en_route or arrived */}
          {canShowPreArrival && (
            <TouchableOpacity
              style={[styles.actionButton, preArrivalData.length > 0 && styles.preArrivalSubmittedButton]}
              onPress={() => setShowPreArrivalModal(true)}
            >
              <Ionicons
                name={preArrivalData.length > 0 ? "checkmark-document" : "document-text"}
                size={24}
                color={Colors.textWhite}
              />
              <Text style={styles.actionButtonText}>
                {preArrivalData.length > 0
                  ? `Update Pre-Arrival Info (${preArrivalData.length} patient${preArrivalData.length > 1 ? 's' : ''})`
                  : 'Pre-Arrival Info (Optional)'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.navigateButton]}
            onPress={() => {
              if (!dispatchId || !incident) {
                Alert.alert('Error', 'Unable to start navigation. Missing dispatch or incident data.');
                return;
              }
              const incidentData = encodeURIComponent(JSON.stringify({
                id: incident.id,
                type: incident.type,
                latitude: incident.latitude,
                longitude: incident.longitude,
                address: incident.address,
                description: incident.description,
              }));
              router.push(
                `/(tabs)/responder/route-map?id=${incident.id}&dispatchId=${dispatchId}&incidentData=${incidentData}`
              );
            }}
          >
            <Ionicons name="navigate" size={24} color={Colors.textWhite} />
            <Text style={styles.actionButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Pre-Arrival Modal */}
      {dispatch && (
        <PreArrivalModal
          visible={showPreArrivalModal}
          onClose={() => setShowPreArrivalModal(false)}
          dispatchId={dispatch.id}
          incidentType={incident?.type}
          callerNameDefault={dispatch.incident?.reporter?.name}
          existingData={preArrivalData.length > 0 ? preArrivalData : null}
          onSuccess={(patients) => {
            console.log('[IncidentDetails] Pre-arrival info submitted:', patients.length, 'patient(s)');
            setPreArrivalData(patients);
          }}
        />
      )}
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  headerBanner: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.textWhite,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  statusContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  elapsedTime: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },
  incidentCard: {
    backgroundColor: "#8B5A3C",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  incidentType: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: Colors.textWhite,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  locationText: {
    fontSize: FontSizes.md,
    color: Colors.textWhite,
    flex: 1,
  },
  distanceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  distanceText: {
    fontSize: FontSizes.md,
    color: Colors.textWhite,
    fontWeight: "600",
  },
  descriptionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.textWhite,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
  },
  descriptionText: {
    fontSize: FontSizes.md,
    color: Colors.textWhite,
    lineHeight: 24,
  },
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  phoneNumber: {
    fontSize: FontSizes.md,
    color: "#10B981",
    fontWeight: "600",
  },
  timelineSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  statusActionsContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  actionsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statusActionButton: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusActionText: {
    color: Colors.textWhite,
    fontSize: FontSizes.lg,
    fontWeight: "bold",
  },
  actionsContainer: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  navigateButton: {
    backgroundColor: "#10B981",
  },
  preArrivalSubmittedButton: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  secondaryButtonText: {
    color: '#10B981',
  },
});










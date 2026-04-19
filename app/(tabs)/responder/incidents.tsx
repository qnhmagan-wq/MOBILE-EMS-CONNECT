import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { useDispatch } from "@/src/contexts/DispatchContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import { Dispatch, DispatchStatus } from "@/src/types/dispatch.types";
import { formatDistance } from "@/src/utils/distance";
import { Linking } from "react-native";

export default function ResponderIncidentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeDispatches, isTrackingActive, updateDispatchStatus, refreshDispatches, lastPollTime, lastPollResult, liveDistances } = useDispatch();
  const [status, setStatus] = React.useState<'Available' | 'Busy'>('Available');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshDispatches();
    } catch (err) {
      console.error('[Incidents] Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshDispatches]);

  const getPriority = (type: string): 'HIGH' | 'MID' | 'LOW' => {
    if (type === 'medical' || type === 'fire') {
      return 'HIGH';
    } else if (type === 'accident' || type === 'crime') {
      return 'MID';
    }
    return 'LOW';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return '#EF4444'; // Red
      case 'MID':
        return '#F59E0B'; // Orange
      default:
        return '#10B981'; // Green
    }
  };

  const getStatusColor = (status: DispatchStatus) => {
    switch (status) {
      case 'assigned':
        return '#EF4444'; // Red
      case 'accepted':
        return '#3B82F6'; // Blue
      case 'en_route':
        return '#F59E0B'; // Orange
      case 'arrived':
        return '#8B5CF6'; // Purple
      case 'transporting_to_hospital':
        return '#3B82F6'; // Blue
      case 'completed':
        return '#10B981'; // Green
      case 'cancelled':
        return '#6B7280'; // Gray
      case 'declined':
        return '#6B7280'; // Gray
      default:
        return '#6B7280'; // Gray
    }
  };

  const getStatusLabel = (status: DispatchStatus) => {
    switch (status) {
      case 'assigned':
        return 'NEW';
      case 'accepted':
        return 'ACCEPTED';
      case 'en_route':
        return 'EN ROUTE';
      case 'arrived':
        return 'ON SCENE';
      case 'transporting_to_hospital':
        return 'TRANSPORTING';
      case 'completed':
        return 'COMPLETED';
      case 'declined':
        return 'DECLINED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return (status as string).toUpperCase();
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'medical':
        return '🏥';
      case 'fire':
        return '🔥';
      case 'accident':
        return '🚗';
      case 'crime':
        return '🚨';
      case 'natural_disaster':
        return '⚠️';
      default:
        return '❗';
    }
  };

  // Compute "last polled X seconds ago" text
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const getLastPollText = () => {
    if (!lastPollTime) return 'Waiting for first poll...';
    const seconds = Math.round((Date.now() - lastPollTime.getTime()) / 1000);
    if (seconds < 5) return 'Last polled: just now';
    return `Last polled: ${seconds}s ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Banner - Dark Red */}
      <View style={styles.headerBanner}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="medical" size={32} color={Colors.textWhite} />
          </View>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>WELCOME, {user?.name?.toUpperCase() || 'RESPONDER'}</Text>
            <TouchableOpacity
              style={[styles.statusButton, status === 'Available' && styles.statusButtonActive]}
              onPress={() => setStatus(status === 'Available' ? 'Busy' : 'Available')}
            >
              <Text style={styles.statusButtonText}>{status}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications" size={24} color={Colors.textWhite} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Incident Notifications Module:</Text>
        {isTrackingActive && (
          <Text style={styles.pollStatus}>{getLastPollText()}</Text>
        )}
      </View>

      {/* Dispatches List */}
      {!isTrackingActive ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
          }
        >
          <Ionicons name="moon-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>You are Off Duty</Text>
          <Text style={styles.emptyText}>
            Toggle duty status to ON in the Home screen to start receiving dispatch assignments
          </Text>
        </ScrollView>
      ) : activeDispatches.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
          }
        >
          <Ionicons name="checkmark-circle-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Active Dispatches</Text>
          <Text style={styles.emptyText}>
            Pull down to refresh. You will receive a notification when assigned to an emergency.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.incidentsList}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
          }
        >
          {activeDispatches.map((dispatch) => {
            const priority = dispatch.incident ? getPriority(dispatch.incident.type) : 'LOW';
            return (
              <TouchableOpacity
                key={dispatch.id}
                style={styles.incidentCard}
                onPress={() => router.push(`/(tabs)/responder/incident-details?id=${dispatch.incident_id}&dispatchId=${dispatch.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.emergencyIcon}>
                      {getIncidentIcon(dispatch.incident?.type || '')}
                    </Text>
                    <Text style={styles.incidentTitle}>
                      {dispatch.incident
                        ? dispatch.incident.type.charAt(0).toUpperCase() + dispatch.incident.type.slice(1).replace('_', ' ')
                        : 'Unknown Incident'}
                    </Text>
                  </View>
                  <View style={styles.badgeContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dispatch.status) }]}>
                      <Text style={styles.statusText}>{getStatusLabel(dispatch.status)}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(priority) }]}>
                      <Text style={styles.priorityText}>{priority}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={Colors.textWhite} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {dispatch.incident?.address || 'Address unavailable'}
                  </Text>
                </View>
                {dispatch.incident?.description && (
                  <View style={styles.descriptionRow}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <Text style={styles.descriptionPreview} numberOfLines={2}>
                      {dispatch.incident.description}
                    </Text>
                  </View>
                )}
                {(typeof liveDistances[dispatch.id] === 'number' || dispatch.distance_text) && (
                  <View style={styles.distanceRow}>
                    <Ionicons name="navigate" size={16} color={Colors.textWhite} />
                    <Text style={styles.distanceText}>
                      {typeof liveDistances[dispatch.id] === 'number'
                        ? formatDistance(liveDistances[dispatch.id])
                        : dispatch.distance_text}
                      {` • ${dispatch.duration_text || 'Calculating...'}`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom Red Section */}
      <View style={styles.bottomSection} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  headerBanner: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.textWhite,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.textWhite,
    marginBottom: Spacing.xs,
  },
  statusButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusButtonActive: {
    backgroundColor: "#10B981",
  },
  statusButtonText: {
    fontSize: FontSizes.xs,
    fontWeight: "600",
    color: Colors.textWhite,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  titleContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  pollStatus: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  incidentsList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  incidentCard: {
    backgroundColor: "#8B5A3C",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  emergencyIcon: {
    fontSize: 28,
    marginRight: Spacing.xs,
  },
  incidentTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "bold",
    color: Colors.textWhite,
    flex: 1,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: "bold",
    color: Colors.textWhite,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: FontSizes.xs,
    fontWeight: "bold",
    color: Colors.textWhite,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  locationText: {
    fontSize: FontSizes.sm,
    color: Colors.textWhite,
    flex: 1,
  },
  descriptionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  warningIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  descriptionPreview: {
    fontSize: FontSizes.sm,
    color: Colors.textWhite,
    flex: 1,
    lineHeight: 18,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  distanceText: {
    fontSize: FontSizes.sm,
    color: Colors.textWhite,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  pollDiagnosticText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: "center",
    fontFamily: 'monospace',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  bottomSection: {
    height: 100,
    backgroundColor: Colors.primary,
  },
});

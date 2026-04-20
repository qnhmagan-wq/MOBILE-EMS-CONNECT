import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, ActivityIndicator, Alert, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/contexts/AuthContext";
import { useDispatch } from "@/src/contexts/DispatchContext";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import { scale, scaleFontSize, scaleSpacing } from "@/src/utils/responsive";
import { getDispatches } from "@/src/services/dispatch.service";
import { useDiagTapToggle } from "@/src/hooks/useDiagTapToggle";

export default function ResponderHomeScreen() {
  const { user } = useAuth();
  const {
    isTrackingActive,
    hasLocationPermission,
    locationLastSent,
    isBackendConfirmed,
    dutyStatusConfirmed,
    locationFailureCount,
    isLoading,
    error,
    clearError,
    retryDispatches,
    activeDispatches,
    lastPollTime,
    lastPollResult,
  } = useDispatch();

  const [debugLoading, setDebugLoading] = useState(false);
  const handleHeaderTap = useDiagTapToggle();

  const handleDebugFetch = async () => {
    setDebugLoading(true);
    try {
      const response = await getDispatches();
      const dispatches = response.dispatches || [];
      const nearby = response.nearby_incidents || [];
      const rawKeys = (response as any)._rawKeys || 'unknown';
      const firstId = dispatches.length > 0 ? dispatches[0].id : 'none';
      const firstStatus = dispatches.length > 0 ? dispatches[0].status : 'n/a';

    } catch (err: any) {
      Alert.alert(
        'Debug Fetch Error',
        `Status: ${err.response?.status || 'network'}\n` +
        `Message: ${err.response?.data?.message || err.message}\n` +
        `Data: ${JSON.stringify(err.response?.data || {}).substring(0, 300)}`
      );
    } finally {
      setDebugLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <TouchableWithoutFeedback onPress={handleHeaderTap}>
          <View style={styles.header}>
            <Ionicons name="medical" size={scale(48)} color={Colors.primary} />
            <Text style={styles.title}>EMS Connect Responder</Text>
            {user?.name && (
              <Text style={styles.welcomeText}>Welcome, {user.name}</Text>
            )}
          </View>
        </TouchableWithoutFeedback>

        {/* Error Display */}
        {error && (
          <View style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={scale(24)} color="#EF4444" />
              <Text style={styles.errorTitle}>Error</Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorButtonRow}>
              <TouchableOpacity style={styles.retryButton} onPress={retryDispatches}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dismissButton} onPress={clearError}>
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Location Tracking Status */}
        <View style={styles.trackingStatusCard}>
          <View style={styles.trackingHeader}>
            <Ionicons name="location" size={scale(24)} color={Colors.primary} />
            <Text style={styles.trackingTitle}>Location Tracking</Text>
          </View>
          <View style={styles.trackingStatusRow}>
            <View style={[styles.trackingIndicator, {
              backgroundColor: isTrackingActive ? '#10B981' : '#6B7280'
            }]} />
            <Text style={styles.trackingStatusText}>
              {isTrackingActive ? 'ACTIVE (Background)' : 'INACTIVE'}
            </Text>
          </View>

          {isTrackingActive && locationLastSent && (
            <Text style={styles.lastUpdateText}>
              Last update: {locationLastSent.toLocaleTimeString()}
            </Text>
          )}

          {/* Backend Status Indicators */}
          <View style={styles.backendStatusRow}>
            <View style={styles.backendStatusItem}>
              <View style={[styles.trackingIndicator, {
                backgroundColor: dutyStatusConfirmed ? '#10B981' : '#EF4444'
              }]} />
              <Text style={styles.backendStatusText}>
                Duty: {dutyStatusConfirmed ? 'Confirmed' : 'Not Confirmed'}
              </Text>
            </View>
            <View style={styles.backendStatusItem}>
              <View style={[styles.trackingIndicator, {
                backgroundColor: isBackendConfirmed ? '#10B981' : (isTrackingActive ? '#F59E0B' : '#EF4444')
              }]} />
              <Text style={styles.backendStatusText}>
                Location: {isBackendConfirmed ? 'Sent' : (isTrackingActive ? 'Sent (Background)' : 'Not Sent')}
              </Text>
            </View>
          </View>

          {!dutyStatusConfirmed && isTrackingActive && (
            <View style={[styles.permissionWarning, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="alert-circle" size={scale(16)} color="#EF4444" />
              <Text style={[styles.permissionWarningText, { color: '#991B1B' }]}>
                Backend has not confirmed on-duty status. Dispatches may not appear. Check console logs for details.
              </Text>
            </View>
          )}

          {locationFailureCount >= 3 && !isTrackingActive && (
            <View style={[styles.permissionWarning, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="alert-circle" size={scale(16)} color="#EF4444" />
              <Text style={[styles.permissionWarningText, { color: '#991B1B' }]}>
                Location updates failing ({locationFailureCount} failures). GPS signal may be weak.
              </Text>
            </View>
          )}

          {!hasLocationPermission && (
            <View style={styles.permissionWarning}>
              <Ionicons name="warning" size={scale(16)} color="#F59E0B" />
              <Text style={styles.permissionWarningText}>
                Location permission required for automatic tracking
              </Text>
            </View>
          )}
        </View>

        {/* Active Services Indicators */}
        <View style={styles.servicesCard}>
          <Text style={styles.servicesLabel}>Active Services</Text>
          <View style={styles.servicesList}>
            <View style={styles.serviceItem}>
              <Ionicons
                name="location"
                size={scale(20)}
                color={isTrackingActive ? '#10B981' : '#6B7280'}
              />
              <Text style={[styles.serviceText, { color: isTrackingActive ? '#10B981' : '#6B7280' }]}>
                Background Location
              </Text>
              {isTrackingActive && (
                <View style={styles.activeIndicator} />
              )}
            </View>
            <View style={styles.serviceItem}>
              <Ionicons
                name="notifications"
                size={scale(20)}
                color={isTrackingActive ? '#10B981' : '#6B7280'}
              />
              <Text style={[styles.serviceText, { color: isTrackingActive ? '#10B981' : '#6B7280' }]}>
                Dispatch Monitoring
              </Text>
              {isTrackingActive && (
                <View style={styles.activeIndicator} />
              )}
            </View>
          </View>
        </View>

        {/* Active Dispatches Summary */}
        <View style={styles.dispatchSummaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="flash" size={scale(24)} color={Colors.primary} />
            <Text style={styles.summaryTitle}>Active Dispatches</Text>
          </View>
          <Text style={styles.summaryCount}>
            {activeDispatches.length} {activeDispatches.length === 1 ? 'dispatch' : 'dispatches'}
          </Text>
        </View>

        
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={scale(24)} color={Colors.primary} />
          <Text style={styles.infoText}>
            {isTrackingActive
              ? `Location tracking active.${locationLastSent ? ` Last update: ${locationLastSent.toLocaleTimeString()}.` : ''} You will receive notifications for emergency assignments.`
              : "Grant location permission to enable automatic background tracking and receive emergency dispatch assignments."
            }
          </Text>
        </View>

        {/* Ready/Offline Card */}
        <View style={[styles.readyCard, { backgroundColor: isTrackingActive ? '#f0fdf4' : '#f3f4f6', borderColor: isTrackingActive ? '#10B981' : '#9CA3AF' }]}>
          <Ionicons
            name={isTrackingActive ? "checkmark-circle" : "moon"}
            size={scale(32)}
            color={isTrackingActive ? '#10B981' : '#6B7280'}
          />
          <Text style={[styles.readyText, { color: isTrackingActive ? '#10B981' : '#6B7280' }]}>
            {isTrackingActive ? 'Ready for Dispatch' : 'Waiting for Permission'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  // Error Card
  errorCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  errorTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: "#991B1B",
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  errorButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: "#10B981",
    borderRadius: BorderRadius.sm,
  },
  retryButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.textWhite,
  },
  dismissButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: "#EF4444",
    borderRadius: BorderRadius.sm,
  },
  dismissButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.textWhite,
  },
  // Tracking Status Card
  trackingStatusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trackingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  trackingTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  trackingStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  trackingIndicator: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
  },
  trackingStatusText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  lastUpdateText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  backendStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backendStatusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  backendStatusText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  permissionWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: "#FEF3C7",
    borderRadius: BorderRadius.sm,
  },
  permissionWarningText: {
    fontSize: FontSizes.sm,
    color: "#92400E",
    flex: 1,
  },
  // Services Card
  servicesCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  servicesLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  servicesList: {
    gap: Spacing.md,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  serviceText: {
    fontSize: FontSizes.md,
    flex: 1,
  },
  activeIndicator: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: "#10B981",
  },
  // Dispatch Summary Card
  dispatchSummaryCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  summaryTitle: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  summaryCount: {
    fontSize: FontSizes.xxl,
    fontWeight: "bold",
    color: "#F59E0B",
  },
  // Diagnostics Card
  diagnosticsCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  diagnosticsHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  diagnosticsTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  diagnosticsText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  debugFetchButton: {
    marginTop: Spacing.sm,
    backgroundColor: '#6B7280',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  debugFetchButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '600' as const,
    color: Colors.textWhite,
  },
  // Info Card
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    flex: 1,
    marginLeft: Spacing.md,
  },
  // Ready/Offline Card
  readyCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
  },
  readyText: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
});

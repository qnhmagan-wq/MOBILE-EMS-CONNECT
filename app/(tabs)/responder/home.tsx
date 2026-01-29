import React from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/contexts/AuthContext";
import { useDispatch } from "@/src/contexts/DispatchContext";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import { scale, scaleFontSize, scaleSpacing } from "@/src/utils/responsive";

export default function ResponderHomeScreen() {
  const { user } = useAuth();
  const {
    isTrackingActive,
    hasLocationPermission,
    locationLastSent,
    isBackendConfirmed,
    isLoading,
    error,
    clearError,
    activeDispatches,
  } = useDispatch();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Ionicons name="medical" size={scale(48)} color={Colors.primary} />
          <Text style={styles.title}>EMS Connect Responder</Text>
          {user?.name && (
            <Text style={styles.welcomeText}>Welcome, {user.name}</Text>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={scale(24)} color="#EF4444" />
              <Text style={styles.errorTitle}>Error</Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.dismissButton} onPress={clearError}>
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
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

          {/* **FIX #5: Backend connection status indicator** */}
          {isTrackingActive && (
            <View style={styles.backendStatusRow}>
              <View style={[styles.backendStatusDot, {
                backgroundColor: isBackendConfirmed ? '#10B981' : '#F59E0B'
              }]} />
              <View style={styles.backendStatusTextContainer}>
                <Text style={[styles.backendStatusText, {
                  color: isBackendConfirmed ? '#10B981' : '#F59E0B'
                }]}>
                  {isBackendConfirmed ? 'Backend Connected' : 'Connecting...'}
                </Text>
                {locationLastSent && isBackendConfirmed && (
                  <Text style={styles.lastUpdateText}>
                    Last update: {locationLastSent.toLocaleTimeString()}
                  </Text>
                )}
              </View>
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
              ? isBackendConfirmed
                ? `Location tracking active. Last update: ${locationLastSent ? locationLastSent.toLocaleTimeString() : 'sending...'}. You will receive notifications for emergency assignments.`
                : "Location tracking starting... Waiting for backend confirmation. Please keep the app open for a moment."
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
  dismissButton: {
    alignSelf: "flex-end",
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
  // **FIX #5: Backend status indicator styles**
  backendStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: "#F9FAFB",
    borderRadius: BorderRadius.sm,
  },
  backendStatusDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
  },
  backendStatusTextContainer: {
    flex: 1,
  },
  backendStatusText: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  lastUpdateText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
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

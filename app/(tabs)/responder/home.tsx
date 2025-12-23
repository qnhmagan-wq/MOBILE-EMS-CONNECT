import React from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/contexts/AuthContext";
import { useDispatch } from "@/src/contexts/DispatchContext";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";

export default function ResponderHomeScreen() {
  const { user } = useAuth();
  const {
    isOnDuty,
    isLocationTracking,
    toggleDutyStatus,
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
          <Ionicons name="medical" size={48} color={Colors.primary} />
          <Text style={styles.title}>EMS Connect Responder</Text>
          {user?.name && (
            <Text style={styles.welcomeText}>Welcome, {user.name}</Text>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorCard}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.errorTitle}>Error</Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.dismissButton} onPress={clearError}>
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Duty Toggle Card */}
        <View style={styles.dutyToggleCard}>
          <Text style={styles.dutyLabel}>Duty Status</Text>
          <View style={styles.dutyToggleContainer}>
            <View style={styles.dutyStatusInfo}>
              <View style={[styles.dutyIndicator, { backgroundColor: isOnDuty ? '#10B981' : '#6B7280' }]} />
              <Text style={styles.dutyStatusText}>
                {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
              </Text>
            </View>
            <Switch
              value={isOnDuty}
              onValueChange={toggleDutyStatus}
              disabled={isLoading}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={isOnDuty ? '#10B981' : '#9CA3AF'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Updating status...</Text>
            </View>
          )}
        </View>

        {/* Active Services Indicators */}
        {isOnDuty && (
          <View style={styles.servicesCard}>
            <Text style={styles.servicesLabel}>Active Services</Text>
            <View style={styles.servicesList}>
              <View style={styles.serviceItem}>
                <Ionicons
                  name="location"
                  size={20}
                  color={isLocationTracking ? '#10B981' : '#6B7280'}
                />
                <Text style={[styles.serviceText, { color: isLocationTracking ? '#10B981' : '#6B7280' }]}>
                  Location Tracking
                </Text>
                {isLocationTracking && (
                  <View style={styles.activeIndicator} />
                )}
              </View>
              <View style={styles.serviceItem}>
                <Ionicons
                  name="notifications"
                  size={20}
                  color={isOnDuty ? '#10B981' : '#6B7280'}
                />
                <Text style={[styles.serviceText, { color: isOnDuty ? '#10B981' : '#6B7280' }]}>
                  Dispatch Monitoring
                </Text>
                {isOnDuty && (
                  <View style={styles.activeIndicator} />
                )}
              </View>
            </View>
          </View>
        )}

        {/* Active Dispatches Summary */}
        {isOnDuty && (
          <View style={styles.dispatchSummaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="flash" size={24} color={Colors.primary} />
              <Text style={styles.summaryTitle}>Active Dispatches</Text>
            </View>
            <Text style={styles.summaryCount}>
              {activeDispatches.length} {activeDispatches.length === 1 ? 'dispatch' : 'dispatches'}
            </Text>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            {isOnDuty
              ? "You are currently on duty. You will receive notifications for emergency assignments."
              : "Toggle duty status to ON to start receiving emergency dispatch assignments."
            }
          </Text>
        </View>

        {/* Ready/Offline Card */}
        <View style={[styles.readyCard, { backgroundColor: isOnDuty ? '#f0fdf4' : '#f3f4f6', borderColor: isOnDuty ? '#10B981' : '#9CA3AF' }]}>
          <Ionicons
            name={isOnDuty ? "checkmark-circle" : "moon"}
            size={32}
            color={isOnDuty ? '#10B981' : '#6B7280'}
          />
          <Text style={[styles.readyText, { color: isOnDuty ? '#10B981' : '#6B7280' }]}>
            {isOnDuty ? 'Ready for Dispatch' : 'Currently Offline'}
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
  // Duty Toggle Card
  dutyToggleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dutyLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dutyToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dutyStatusInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  dutyIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: Spacing.sm,
  },
  dutyStatusText: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  loadingText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
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
    width: 8,
    height: 8,
    borderRadius: 4,
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

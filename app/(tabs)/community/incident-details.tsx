import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import StatusBadge from "@/components/StatusBadge";
import UnreadBadge from "@/components/UnreadBadge";
import { Incident } from "@/src/types/incident.types";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import * as incidentService from "@/src/services/incident.service";

export default function IncidentDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const incidentId = params.id ? parseInt(params.id as string) : null;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchIncident = async () => {
    if (!incidentId) return;

    try {
      const fetchedIncident = await incidentService.getIncident(incidentId);
      setIncident(fetchedIncident);
    } catch (error: any) {
      console.error("Failed to fetch incident:", error);
      Alert.alert("Error", "Failed to load incident details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchIncident, 10000);
    return () => clearInterval(interval);
  }, [incidentId]);

  const handleCancel = async () => {
    if (!incident || !incidentId) return;

    Alert.alert(
      "Cancel Incident",
      "Are you sure you want to cancel this incident?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setIsCancelling(true);
            try {
              await incidentService.cancelIncident(incidentId);
              Alert.alert("Success", "Incident cancelled successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to cancel incident"
              );
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case "medical":
        return "medical";
      case "fire":
        return "flame";
      case "accident":
        return "car";
      case "crime":
        return "shield";
      case "natural_disaster":
        return "warning";
      default:
        return "alert-circle";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading incident details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!incident) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.danger} />
          <Text style={styles.errorText}>Incident not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <StatusBadge status={incident.status} size="large" />
        </View>

        {/* Incident Type */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name={getIncidentIcon(incident.type) as any}
              size={24}
              color={Colors.primary}
            />
            <Text style={styles.sectionTitle}>Type</Text>
          </View>
          <Text style={styles.sectionValue}>
            {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          <Text style={styles.sectionValue}>{incident.address}</Text>
          <Text style={styles.coordinates}>
            {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text style={styles.sectionValue}>{incident.description}</Text>
        </View>

        {/* Messages Button */}
        {["pending", "dispatched", "in_progress"].includes(incident.status) && (
          <TouchableOpacity
            style={styles.messagesButton}
            onPress={() => router.push(`/(tabs)/community/chat?id=${incident.id}`)}
          >
            <View style={styles.messagesButtonContent}>
              <Ionicons name="chatbubbles" size={20} color={Colors.primary} />
              <Text style={styles.messagesButtonText}>View Messages</Text>
              <UnreadBadge incidentId={incident.id} size="small" />
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Track Responders Button */}
        {["dispatched", "in_progress"].includes(incident.status) && (
          <TouchableOpacity
            style={styles.trackingButton}
            onPress={() => router.push(`/(tabs)/community/report?focus=${incident.id}`)}
          >
            <View style={styles.trackingButtonContent}>
              <Ionicons name="navigate" size={20} color={Colors.responderPrimary} />
              <Text style={styles.trackingButtonText}>Track Responders</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Timestamps */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Timeline</Text>
          </View>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Reported:</Text>
              <Text style={styles.timelineValue}>{formatDate(incident.created_at)}</Text>
            </View>
            {incident.dispatched_at && (
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Dispatched:</Text>
                <Text style={styles.timelineValue}>
                  {formatDate(incident.dispatched_at)}
                </Text>
              </View>
            )}
            {incident.completed_at && (
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>Completed:</Text>
                <Text style={styles.timelineValue}>
                  {formatDate(incident.completed_at)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Cancel Button (only for pending/dispatched) */}
        {["pending", "dispatched"].includes(incident.status) && (
          <TouchableOpacity
            style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
            onPress={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancel Incident</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
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
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    color: Colors.textPrimary,
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
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  coordinates: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: "monospace",
  },
  timeline: {
    gap: Spacing.sm,
  },
  timelineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  timelineLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  timelineValue: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "right",
  },
  cancelButton: {
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  messagesButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messagesButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  messagesButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
  },
  trackingButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.responderPrimary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trackingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  trackingButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.responderPrimary,
  },
});







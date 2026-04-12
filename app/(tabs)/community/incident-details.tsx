import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const fetchIncident = useCallback(async () => {
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
  }, [incidentId]);

  useEffect(() => {
    fetchIncident();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchIncident, 10000);
    return () => clearInterval(interval);
  }, [fetchIncident]);

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

  const handleSubmitFeedback = async () => {
    if (!incident || feedbackRating === 0) return;

    setIsSubmittingFeedback(true);
    try {
      const response = await incidentService.submitFeedback(incident.id, {
        rating: feedbackRating,
        comment: feedbackComment.trim() || null,
      });

      // Update local incident state with submitted feedback
      setIncident({
        ...incident,
        feedback: response.feedback,
        can_submit_feedback: false,
      });
      setFeedbackRating(0);
      setFeedbackComment("");

      Alert.alert("Thank You!", "Your feedback has been submitted successfully.");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to submit feedback. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setIsSubmittingFeedback(false);
    }
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
        <View style={styles.placeholder} />
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

        {/* Feedback — submitted (read-only) */}
        {(() => {
          const fb = incident.feedback;
          if (!fb) return null;
          return (
            <View style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <Text style={styles.feedbackHeaderText}>Thank you for your feedback</Text>
              </View>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= fb.rating ? "star" : "star-outline"}
                    size={24}
                    color={star <= fb.rating ? "#F59E0B" : "#D1D5DB"}
                  />
                ))}
              </View>
              {fb.comment && (
                <Text style={styles.feedbackCommentReadonly}>{fb.comment}</Text>
              )}
            </View>
          );
        })()}

        {/* Feedback — submit form */}
        {!incident.feedback && incident.can_submit_feedback && (
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text style={styles.feedbackHeaderText}>How was your experience?</Text>
            </View>
            <Text style={styles.feedbackHint}>Your feedback helps improve emergency response</Text>

            {/* Star Rating */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setFeedbackRating(star)}
                  disabled={isSubmittingFeedback}
                >
                  <Ionicons
                    name={star <= feedbackRating ? "star" : "star-outline"}
                    size={36}
                    color={star <= feedbackRating ? "#F59E0B" : "#D1D5DB"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment */}
            <TextInput
              style={styles.feedbackInput}
              value={feedbackComment}
              onChangeText={setFeedbackComment}
              placeholder="Share your experience... (optional)"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
              maxLength={1000}
              editable={!isSubmittingFeedback}
              textAlignVertical="top"
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.feedbackSubmitButton, (feedbackRating === 0 || isSubmittingFeedback) && styles.feedbackSubmitDisabled]}
              onPress={handleSubmitFeedback}
              disabled={feedbackRating === 0 || isSubmittingFeedback}
            >
              {isSubmittingFeedback ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.feedbackSubmitText}>Submit Feedback</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

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
  backButtonText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
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
  // Feedback styles
  feedbackCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderLeftWidth: 4,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  feedbackHeaderText: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  feedbackHint: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  starsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    minHeight: 80,
    backgroundColor: "#F9FAFB",
    marginBottom: Spacing.md,
  },
  feedbackSubmitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  feedbackSubmitDisabled: {
    opacity: 0.5,
  },
  feedbackSubmitText: {
    color: "#fff",
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  feedbackCommentReadonly: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
    fontStyle: "italic",
  },
});










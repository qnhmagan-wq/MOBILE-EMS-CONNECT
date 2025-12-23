import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useIncidents } from "@/src/hooks/useIncidents";
import StatusBadge from "@/components/StatusBadge";
import { Incident } from "@/src/types/incident.types";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import * as incidentService from "@/src/services/incident.service";

export default function HistoryScreen() {
  const router = useRouter();
  const { incidents, loadIncidents, isLoading } = useIncidents();
  const [previousStatuses, setPreviousStatuses] = useState<Record<number, string>>({});

  // Load incidents on mount
  useEffect(() => {
    loadIncidents();
  }, []);

  // Poll for status updates every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const updatedIncidents = await incidentService.getIncidents();
        
        // Check for status changes
        updatedIncidents.forEach((incident: Incident) => {
          const previousStatus = previousStatuses[incident.id];
          
          if (previousStatus && previousStatus !== incident.status) {
            // Status changed!
            if (incident.status === 'dispatched') {
              Alert.alert(
                '🚑 Emergency Dispatched',
                'Your emergency has been dispatched. Help is on the way!',
                [{ text: 'OK' }]
              );
            } else if (incident.status === 'completed') {
              Alert.alert(
                '✅ Emergency Resolved',
                'Your emergency has been resolved.',
                [{ text: 'OK' }]
              );
            }
          }
        });

        // Update previous statuses
        const newStatuses: Record<number, string> = {};
        updatedIncidents.forEach((incident: Incident) => {
          newStatuses[incident.id] = incident.status;
        });
        setPreviousStatuses(newStatuses);

        // Reload incidents to update UI
        loadIncidents();
      } catch (error) {
        console.error('Failed to poll incidents:', error);
      }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [previousStatuses, loadIncidents]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'medical':
        return 'medical';
      case 'fire':
        return 'flame';
      case 'accident':
        return 'car';
      case 'crime':
        return 'shield';
      case 'natural_disaster':
        return 'warning';
      default:
        return 'alert-circle';
    }
  };

  if (isLoading && incidents.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading incidents...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your incident reports</Text>
        </View>

        {incidents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptyText}>
              Your incident reports will appear here
            </Text>
          </View>
        ) : (
          incidents.map((incident) => (
            <TouchableOpacity
              key={incident.id}
              style={styles.incidentCard}
              onPress={() => router.push(`/(tabs)/community/incident-details?id=${incident.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons
                    name={getIncidentIcon(incident.type) as any}
                    size={24}
                    color={Colors.primary}
                  />
                  <Text style={styles.incidentType}>
                    {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
                  </Text>
                </View>
                <StatusBadge status={incident.status} size="small" />
              </View>

              <Text style={styles.incidentDescription} numberOfLines={2}>
                {incident.description}
              </Text>

              <View style={styles.incidentLocation}>
                <Ionicons name="location" size={16} color={Colors.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {incident.address}
                </Text>
              </View>

              <View style={styles.incidentFooter}>
                <Text style={styles.dateText}>
                  {formatDate(incident.created_at)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
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
    backgroundColor: Colors.surface,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: 60,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  incidentCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  },
  incidentType: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  incidentDescription: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  incidentLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  locationText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  incidentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dateText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});

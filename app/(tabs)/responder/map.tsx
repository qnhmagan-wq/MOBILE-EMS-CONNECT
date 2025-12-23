import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import * as incidentService from "@/src/services/incident.service";
import { Incident } from "@/src/types/incident.types";

export default function NavigationMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const incidentId = params.id ? parseInt(params.id as string) : null;
  const { user } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);

  useEffect(() => {
    if (incidentId) {
      loadIncident();
    }
  }, [incidentId]);

  const loadIncident = async () => {
    if (!incidentId) return;
    try {
      const loadedIncident = await incidentService.getIncident(incidentId);
      setIncident(loadedIncident);
    } catch (error) {
      console.error('Failed to load incident:', error);
    }
  };

  const openInMaps = () => {
    if (!incident) return;
    // Open in external maps app
    const url = `https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`;
    // In a real app, you'd use Linking.openURL(url)
    console.log('Opening maps:', url);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="medical" size={32} color={Colors.textWhite} />
          </View>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>WELCOME, {user?.name?.toUpperCase() || 'RESPONDER'}</Text>
            <TouchableOpacity style={[styles.statusButton, styles.statusButtonActive]}>
              <Text style={styles.statusButtonText}>Available</Text>
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
        <Text style={styles.title}>Navigation and Route Module:</Text>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={64} color={Colors.textSecondary} />
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapSubtext}>
            {incident 
              ? `Navigate to: ${incident.address}`
              : "Select an incident to view navigation"}
          </Text>
          {incident && (
            <TouchableOpacity style={styles.navigateButton} onPress={openInMaps}>
              <Ionicons name="navigate" size={20} color={Colors.textWhite} />
              <Text style={styles.navigateButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Route Details */}
      {incident && (
        <View style={styles.routeDetails}>
          <Text style={styles.routeTitle}>Fastest Route</Text>
          <View style={styles.routeSummary}>
            <Text style={styles.routeTime}>7 min (2.5 km)</Text>
            <Text style={styles.routeVia}>via East Ave</Text>
            <Text style={styles.routeNote}>Fastest route, the usual traffic</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.destination}>
            <Text style={styles.destinationName}>Emergency Location</Text>
            <Text style={styles.destinationAddress}>{incident.address}</Text>
            <Text style={styles.destinationCoordinates}>
              {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: Colors.textWhite,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  mapText: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  mapSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  navigateButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  navigateButtonText: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  routeDetails: {
    backgroundColor: Colors.textWhite,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  routeTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    fontFamily: "serif",
  },
  routeSummary: {
    marginBottom: Spacing.md,
  },
  routeTime: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: "#10B981",
    marginBottom: Spacing.xs,
  },
  routeVia: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  routeNote: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  destination: {
    marginTop: Spacing.sm,
  },
  destinationName: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  destinationAddress: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  destinationCoordinates: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontFamily: "monospace",
  },
  bottomSection: {
    height: 100,
    backgroundColor: Colors.primary,
  },
});

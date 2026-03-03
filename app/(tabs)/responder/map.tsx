/**
 * Map Overview Screen
 *
 * Shows an overview map with:
 * - Responder's current location (blue dot with continuous tracking)
 * - Active incident markers (red pins with incident type icons)
 * - Tap incident markers to show callout with incident details
 * - Real-time location updates every 5 seconds or 10 meters
 */

import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, SafeAreaView, Text, ActivityIndicator } from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useDispatch } from "@/src/contexts/DispatchContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function MapOverviewScreen() {
  const { activeDispatches } = useDispatch();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  /**
   * Setup location tracking on mount
   */
  useEffect(() => {
    let mounted = true;

    const setupLocationTracking = async () => {
      try {
        console.log('[Map Overview] Requesting location permission...');

        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (mounted) {
            setError('Location permission denied. Please enable location access in your device settings.');
            setIsLoading(false);
          }
          return;
        }

        // Get initial location
        console.log('[Map Overview] Getting initial location...');
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (mounted) {
          setLocation(initialLocation);

          // Set initial region centered on user
          const initialRegion = {
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setRegion(initialRegion);

          setIsLoading(false);
          console.log('[Map Overview] Initial location:', initialLocation.coords);
        }

        // Start continuous tracking
        // Updates every 5 seconds OR when user moves 10 meters
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10, // 10 meters
            timeInterval: 5000, // 5 seconds
          },
          (newLocation) => {
            if (mounted) {
              setLocation(newLocation);
              console.log('[Map Overview] Location updated:', newLocation.coords);
            }
          }
        );

        console.log('[Map Overview] Continuous tracking started');
      } catch (err: any) {
        console.error('[Map Overview] Location error:', err);
        if (mounted) {
          setError(err.message || 'Failed to get location. Please try again.');
          setIsLoading(false);
        }
      }
    };

    setupLocationTracking();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        console.log('[Map Overview] Location tracking stopped');
      }
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  // Show error state
  if (error) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={Colors.danger} />
            <Text style={styles.errorTitle}>Map Error</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region || {
            latitude: 14.5995, // Manila default
            longitude: 120.9842,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsTraffic={false}
        >
          {/* Active Incident Markers */}
          {activeDispatches.map((dispatch) => (
            <Marker
              key={`dispatch-${dispatch.id}`}
              coordinate={{
                latitude: dispatch.incident.latitude,
                longitude: dispatch.incident.longitude,
              }}
              pinColor={Colors.danger}
              title={`${dispatch.incident.type.charAt(0).toUpperCase() + dispatch.incident.type.slice(1).replace('_', ' ')} Emergency`}
              description={`${dispatch.incident.address}\nStatus: ${dispatch.status.toUpperCase().replace('_', ' ')}`}
              tracksViewChanges={false}
            />
          ))}
        </MapView>

        {/* Info Panel - Shows incident count */}
        <View style={styles.infoPanel}>
          <View style={styles.incidentCountContainer}>
            <Ionicons name="alert-circle" size={20} color={Colors.primary} />
            <Text style={styles.incidentCountText}>
              {activeDispatches.length} Active {activeDispatches.length === 1 ? 'Incident' : 'Incidents'}
            </Text>
          </View>
          {activeDispatches.length === 0 && (
            <Text style={styles.noIncidentsText}>
              No active incidents at this time
            </Text>
          )}
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  infoPanel: {
    position: 'absolute',
    top: 60,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  incidentCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  incidentCountText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  noIncidentsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
});

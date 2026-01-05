/**
 * Route Map Screen - PRE-ARRIVAL NAVIGATION
 *
 * Purpose: Real-time navigation from responder to incident location
 * Automatically triggered when responder accepts an incident
 *
 * Features:
 * - Incident location marker (red pin)
 * - Live responder location tracking (updates every 5 seconds)
 * - Auto-update dispatch status to "en_route"
 * - Incident info panel
 * - "I've Arrived" button to mark arrival
 * - Distance and ETA display (placeholder for Google Directions API)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useDispatch } from "@/src/contexts/DispatchContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PreArrivalModal } from "@/src/components/PreArrivalModal";
import * as mapsService from '@/src/services/maps.service';

export default function RouteMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const incidentId = params.id ? parseInt(params.id as string) : null;
  const dispatchId = params.dispatchId ? parseInt(params.dispatchId as string) : null;
  const autoStart = params.autoStart === 'true';

  // Parse incident data from params (primary source)
  let incidentFromParams = null;
  if (params.incidentData) {
    try {
      incidentFromParams = JSON.parse(decodeURIComponent(params.incidentData as string));
    } catch (err) {
      console.error('[Route Map] Failed to parse incident data from params:', err);
    }
  }

  const { dispatches, updateDispatchStatus } = useDispatch();

  // Find the dispatch and incident data from context (fallback)
  const dispatch = dispatches.find(d => d.id === dispatchId);
  const incidentFromContext = dispatch?.incident;

  // Use incident from params if available, otherwise fall back to context
  const incident = incidentFromParams || incidentFromContext;

  const [responderLocation, setResponderLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showPreArrivalModal, setShowPreArrivalModal] = useState(false);

  // Route data from Google Directions API
  const [route, setRoute] = useState<mapsService.RouteResponse | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [eta, setEta] = useState<string | null>(null);

  /**
   * Request location permission and get initial location
   */
  const requestLocationPermission = useCallback(async () => {
    try {
      console.log('[Route Map] Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Location permission denied. Please enable location to use navigation.');
        setIsLoadingLocation(false);
        return false;
      }

      console.log('[Route Map] Getting initial location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setResponderLocation(location);
      setIsLoadingLocation(false);
      console.log('[Route Map] Initial location received:', location.coords);
      return true;
    } catch (err: any) {
      console.error('[Route Map] Location error:', err);
      setError(err.message || 'Failed to get location');
      setIsLoadingLocation(false);
      return false;
    }
  }, []);

  /**
   * Update responder location every 5 seconds
   */
  useEffect(() => {
    if (!incidentId || !dispatchId) {
      console.log('[Route Map] Missing incident or dispatch ID');
      setError('Invalid navigation parameters');
      return;
    }

    if (!incident) {
      console.error('[Route Map] Incident data not found. Params:', {
        incidentId,
        dispatchId,
        hasIncidentFromParams: !!incidentFromParams,
        hasIncidentFromContext: !!incidentFromContext,
        dispatchInContext: !!dispatch,
      });
      setError('Incident data not available. Please try again or contact support.');
      return;
    }

    // Validate required incident fields
    if (!incident.type || !incident.latitude || !incident.longitude) {
      console.error('[Route Map] Incident data incomplete:', incident);
      setError('Incident information is incomplete. Cannot start navigation.');
      return;
    }

    // Request permission and get initial location
    requestLocationPermission();

    // Set up interval to update location every 5 seconds
    const interval = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setResponderLocation(location);
        console.log('[Route Map] Location updated:', location.coords);

        // **PHASE 4: Google Directions API Integration**
        if (incident) {
          try {
            const routeData = await mapsService.getRoute(
              {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              },
              {
                latitude: incident.latitude,
                longitude: incident.longitude,
              }
            );

            setRoute(routeData);
            setDistance(routeData.distance.text);
            setEta(routeData.duration.text);

            console.log('[Route Map] Route updated:', {
              distance: routeData.distance.text,
              eta: routeData.duration.text,
            });
          } catch (err: any) {
            console.error('[Route Map] Failed to get route:', err);
            // Fallback to straight-line distance on error
            const distanceMeters = calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              incident.latitude,
              incident.longitude
            );
            const distanceKm = (distanceMeters / 1000).toFixed(2);
            setDistance(`${distanceKm} km (approx)`);
            const etaMinutes = Math.ceil((distanceMeters / 1000) / 40 * 60);
            setEta(`${etaMinutes} min (approx)`);
          }
        }
      } catch (err: any) {
        console.error('[Route Map] Location update error:', err);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [incidentId, dispatchId, incident, requestLocationPermission]);

  /**
   * Auto-update dispatch status to "en_route" when screen loads with autoStart=true
   */
  useEffect(() => {
    if (autoStart && dispatch?.status === 'accepted' && !isUpdatingStatus) {
      console.log('[Route Map] Auto-updating status to en_route');
      setIsUpdatingStatus(true);

      updateDispatchStatus(dispatchId!, 'en_route')
        .then(() => {
          console.log('[Route Map] Status updated to en_route successfully');
        })
        .catch((err) => {
          console.error('[Route Map] Failed to update status:', err);
          Alert.alert('Warning', 'Failed to update dispatch status to En Route');
        })
        .finally(() => {
          setIsUpdatingStatus(false);
        });
    }
  }, [autoStart, dispatch?.status, dispatchId, updateDispatchStatus, isUpdatingStatus]);

  /**
   * Handle "I've Arrived" button press
   */
  const handleArrived = async () => {
    if (!dispatchId) return;

    Alert.alert(
      'Confirm Arrival',
      'Have you arrived at the incident location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "Yes, I've Arrived",
          onPress: async () => {
            setIsUpdatingStatus(true);
            try {
              await updateDispatchStatus(dispatchId, 'arrived');
              console.log('[Route Map] Status updated to arrived');
              Alert.alert(
                'Arrived',
                'You have marked yourself as arrived at the incident location.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(), // Return to incident details
                  },
                ]
              );
            } catch (err: any) {
              console.error('[Route Map] Failed to update arrival status:', err);
              Alert.alert('Error', 'Failed to update arrival status. Please try again.');
            } finally {
              setIsUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Open Google Maps app for external navigation
   */
  const handleExternalNavigation = async () => {
    if (!incident || !responderLocation) return;

    try {
      // Build Google Maps URL with origin and destination
      const url = `https://maps.google.com/maps/dir/?api=1&origin=${responderLocation.coords.latitude},${responderLocation.coords.longitude}&destination=${incident.latitude},${incident.longitude}&travelmode=driving`;

      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
        console.log('[Route Map] Opened external navigation');
      } else {
        Alert.alert(
          'Navigation Unavailable',
          'Unable to open Google Maps. Please ensure Google Maps is installed.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('[Route Map] External navigation error:', error);
      Alert.alert('Error', 'Failed to open Google Maps. Please try again.');
    }
  };

  /**
   * Calculate straight-line distance between two coordinates (Haversine formula)
   */
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Show loading state
  if (isLoadingLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading navigation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || !incident || !responderLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.danger} />
          <Text style={styles.errorTitle}>Navigation Error</Text>
          <Text style={styles.errorText}>
            {error || !incident ? error || 'Incident data not available' : 'Unable to get your location'}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={{
            latitude: responderLocation.coords.latitude,
            longitude: responderLocation.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Incident Location Marker */}
          <Marker
            coordinate={{
              latitude: incident.latitude,
              longitude: incident.longitude,
            }}
            title="Incident Location"
            description={incident.address}
            pinColor={Colors.danger}
          >
            <View style={styles.incidentMarker}>
              <Ionicons name="alert-circle" size={32} color="#fff" />
            </View>
          </Marker>

          {/* Route Polyline - Google Directions API */}
          {route && route.coordinates && route.coordinates.length > 0 && (
            <Polyline
              coordinates={route.coordinates}
              strokeColor={Colors.responderPrimary}
              strokeWidth={4}
              lineDashPattern={[1]}
            />
          )}
        </MapView>

        {/* Incident Info Panel */}
        <View style={styles.infoPanel}>
          <ScrollView
            style={styles.infoPanelScroll}
            contentContainerStyle={styles.infoPanelContent}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <Ionicons name="navigate-circle" size={20} color="#fff" />
              <Text style={styles.statusText}>EN ROUTE</Text>
            </View>

            {/* Incident Type */}
            <View style={styles.incidentInfo}>
              <Ionicons
                name={getIncidentIcon(incident.type)}
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.incidentType}>
                {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)} Emergency
              </Text>
            </View>

            {/* Address */}
            <View style={styles.addressRow}>
              <Ionicons name="location" size={16} color={Colors.textSecondary} />
              <Text style={styles.address}>{incident.address}</Text>
            </View>

            {/* Distance and ETA */}
            {(distance || eta) && (
              <View style={styles.distanceRow}>
                {distance && (
                  <View style={styles.distanceItem}>
                    <Ionicons name="resize" size={16} color={Colors.textSecondary} />
                    <Text style={styles.distanceText}>{distance}</Text>
                  </View>
                )}
                {eta && (
                  <View style={styles.distanceItem}>
                    <Ionicons name="time" size={16} color={Colors.textSecondary} />
                    <Text style={styles.distanceText}>ETA: {eta}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Optional Pre-Arrival Patient Info Button */}
            <TouchableOpacity
              style={styles.preArrivalButton}
              onPress={() => setShowPreArrivalModal(true)}
            >
              <Ionicons name="document-text" size={20} color={Colors.primary} />
              <Text style={styles.preArrivalButtonText}>Add Patient Info (Optional)</Text>
            </TouchableOpacity>

            {/* Get Directions in Google Maps */}
            <TouchableOpacity
              style={styles.externalNavButton}
              onPress={handleExternalNavigation}
            >
              <Ionicons name="map" size={20} color="#4285F4" />
              <Text style={styles.externalNavButtonText}>Open in Google Maps</Text>
            </TouchableOpacity>

            {/* I've Arrived Button */}
            <TouchableOpacity
              style={[styles.arrivedButton, isUpdatingStatus && styles.arrivedButtonDisabled]}
              onPress={handleArrived}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.arrivedButtonText}>I've Arrived</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Pre-Arrival Modal */}
        {dispatchId && (
          <PreArrivalModal
            visible={showPreArrivalModal}
            onClose={() => setShowPreArrivalModal(false)}
            dispatchId={dispatchId}
            incidentType={incident?.type}
            callerNameDefault={incidentFromContext?.reporter?.name}
            onSuccess={() => {
              setShowPreArrivalModal(false);
              Alert.alert('Success', 'Patient information saved successfully');
            }}
          />
        )}

        {/* Back Button */}
        <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back-circle" size={40} color={Colors.primary} />
        </TouchableOpacity>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

/**
 * Get icon name for incident type
 */
function getIncidentIcon(type: string): any {
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
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.surface,
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
    marginBottom: Spacing.xl,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  incidentMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: '50%', // Limit panel to 50% of screen height
  },
  infoPanelScroll: {
    maxHeight: 300, // Limit scroll area height
  },
  infoPanelContent: {
    paddingBottom: Spacing.sm, // Extra padding at bottom for scrolling
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.responderPrimary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  statusText: {
    color: Colors.textWhite,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  incidentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  incidentType: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  address: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  distanceRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  distanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  distanceText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  arrivedButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  arrivedButtonDisabled: {
    opacity: 0.6,
  },
  arrivedButtonText: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  preArrivalButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  preArrivalButtonText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  externalNavButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  externalNavButtonText: {
    color: '#4285F4',
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  backIconButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});

import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Linking, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { useDispatch } from "@/src/contexts/DispatchContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as incidentService from "@/src/services/incident.service";
import * as locationService from "@/src/services/location.service";
import { Incident } from "@/src/types/incident.types";
import { Dispatch, DispatchStatus } from "@/src/types/dispatch.types";
import { GOOGLE_MAPS_API_KEY, MAP_SETTINGS, isGoogleMapsConfigured, getActiveRoutingProvider, isOpenRouteServiceConfigured } from "@/src/config/maps";
import OpenRouteService, { RouteResult, RouteStep } from "@/src/services/openroute.service";

export default function NavigationMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const incidentId = params.id ? parseInt(params.id as string) : null;
  const dispatchId = params.dispatchId ? parseInt(params.dispatchId as string) : null;
  const { user } = useAuth();
  const { dispatches, updateDispatchStatus } = useDispatch();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [hasShownArrivalPrompt, setHasShownArrivalPrompt] = useState(false);
  const [routingProvider, setRoutingProvider] = useState(getActiveRoutingProvider());
  const [orsRoute, setOrsRoute] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [showTurnByTurn, setShowTurnByTurn] = useState(false);

  const mapRef = useRef<MapView>(null);
  const locationCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadIncidentAndDispatch();
    startLocationTracking();

    return () => {
      stopLocationTracking();
    };
  }, [incidentId, dispatchId]);

  useEffect(() => {
    // Update dispatch from context
    if (dispatchId) {
      const found = dispatches.find(d => d.id === dispatchId);
      if (found) {
        setDispatch(found);
      }
    }
  }, [dispatchId, dispatches]);

  useEffect(() => {
    // Fetch route when using OpenRouteService and location is available
    if (routingProvider === 'openroute' && currentLocation && incident && !isLoading) {
      fetchOpenRouteServiceRoute();
    }
  }, [currentLocation, incident, routingProvider, isLoading]);

  const loadIncidentAndDispatch = async () => {
    if (!incidentId) {
      setIsLoading(false);
      return;
    }

    try {
      const loadedIncident = await incidentService.getIncident(incidentId);
      setIncident(loadedIncident);

      // Find dispatch
      if (dispatchId) {
        const foundDispatch = dispatches.find(d => d.id === dispatchId);
        if (foundDispatch) {
          setDispatch(foundDispatch);
        }
      }
    } catch (error) {
      console.error('Failed to load incident:', error);
      Alert.alert('Error', 'Failed to load incident details');
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      // Get initial location
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);

      // Start continuous tracking
      await locationService.startContinuousTracking((location) => {
        setCurrentLocation(location);
        checkArrival(location);
      }, {
        distanceInterval: MAP_SETTINGS.locationDistanceFilter,
        timeInterval: MAP_SETTINGS.locationUpdateInterval,
      });

      // Center map on route
      setTimeout(centerMapOnRoute, 500);
    } catch (error: any) {
      console.error('Location tracking error:', error);
      Alert.alert('Location Error', locationService.getLocationErrorMessage(error));
    }
  };

  const stopLocationTracking = () => {
    locationService.stopContinuousTracking();
    if (locationCheckInterval.current) {
      clearInterval(locationCheckInterval.current);
    }
  };

  const checkArrival = (location: { latitude: number; longitude: number }) => {
    if (!incident || !dispatch || hasShownArrivalPrompt) return;

    const distanceToIncident = locationService.calculateDistance(
      location.latitude,
      location.longitude,
      incident.latitude,
      incident.longitude
    );

    // If within threshold and status is en_route, prompt for arrival
    if (distanceToIncident <= MAP_SETTINGS.arrivalDistanceThreshold && dispatch.status === 'en_route') {
      setHasShownArrivalPrompt(true);
      Alert.alert(
        'Arrived at Incident',
        `You are within ${Math.round(distanceToIncident * 1000)}m of the incident location. Mark as arrived?`,
        [
          {
            text: 'Not Yet',
            style: 'cancel',
            onPress: () => setHasShownArrivalPrompt(false), // Allow prompt again
          },
          {
            text: 'Mark Arrived',
            onPress: () => handleStatusUpdate('arrived'),
          },
        ]
      );
    }
  };

  const centerMapOnRoute = () => {
    if (mapRef.current && currentLocation && incident) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
          { latitude: incident.latitude, longitude: incident.longitude },
        ],
        {
          edgePadding: MAP_SETTINGS.routePadding,
          animated: true,
        }
      );
    }
  };

  const fetchOpenRouteServiceRoute = async () => {
    if (!currentLocation || !incident) return;

    setIsLoadingRoute(true);
    try {
      console.log('[Map] Fetching OpenRouteService route...');
      const route = await OpenRouteService.getRoute(
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        { latitude: incident.latitude, longitude: incident.longitude }
      );

      setOrsRoute(route);
      setDistance(OpenRouteService.formatDistance(route.distance));
      setDuration(OpenRouteService.formatDuration(route.duration));

      console.log('[Map] Route fetched:', {
        distance: OpenRouteService.formatDistance(route.distance),
        duration: OpenRouteService.formatDuration(route.duration),
        steps: route.steps.length,
      });

      // Auto-center map on route
      setTimeout(centerMapOnRoute, 300);
    } catch (error: any) {
      console.error('[Map] Failed to fetch route:', error);
      Alert.alert(
        'Route Error',
        'Could not fetch route from OpenRouteService. Please check your connection.'
      );
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const handleStatusUpdate = async (newStatus: DispatchStatus) => {
    if (!dispatch) return;

    setIsUpdatingStatus(true);
    try {
      await updateDispatchStatus(dispatch.id, newStatus);
      Alert.alert('Success', `Status updated to ${newStatus.replace('_', ' ')}`);

      // If completed, go back
      if (newStatus === 'completed') {
        setTimeout(() => router.back(), 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openInExternalMaps = () => {
    if (!incident) return;

    const destination = `${incident.latitude},${incident.longitude}`;

    if (Platform.OS === 'ios') {
      // Apple Maps
      const url = `maps://app?daddr=${destination}&dirflg=d`;
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to Google Maps web
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
        }
      });
    } else {
      // Google Maps (Android)
      const url = `google.navigation:q=${destination}&mode=d`;
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to web
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
        }
      });
    }
  };

  const getStatusButtonConfig = () => {
    if (!dispatch) return null;

    switch (dispatch.status) {
      case 'assigned':
        return { label: 'Accept & Start Navigation', status: 'accepted' as DispatchStatus, color: '#10B981' };
      case 'accepted':
        return { label: "I'm En Route", status: 'en_route' as DispatchStatus, color: '#3B82F6' };
      case 'en_route':
        return { label: "Mark as Arrived", status: 'arrived' as DispatchStatus, color: '#8B5CF6' };
      case 'arrived':
        return { label: 'Complete Incident', status: 'completed' as DispatchStatus, color: '#10B981' };
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!incident) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.textSecondary} />
          <Text style={styles.errorText}>Incident not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusButtonConfig = getStatusButtonConfig();

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButtonFloating} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={Colors.textWhite} />
      </TouchableOpacity>

      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : MAP_SETTINGS.defaultRegion
        }
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsTraffic={true}
      >
        {/* Current location marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            description="Current position"
            pinColor="blue"
          >
            <View style={styles.currentLocationMarker}>
              <Ionicons name="navigate-circle" size={40} color="#3B82F6" />
            </View>
          </Marker>
        )}

        {/* Incident location marker */}
        <Marker
          coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
          title={`${incident.type.toUpperCase()} Emergency`}
          description={incident.address}
          pinColor="red"
        >
          <View style={styles.incidentMarker}>
            <Ionicons name="warning" size={40} color="#EF4444" />
          </View>
        </Marker>

        {/* Route directions - Google Maps */}
        {currentLocation && routingProvider === 'google' && isGoogleMapsConfigured() && (
          <MapViewDirections
            origin={currentLocation}
            destination={{ latitude: incident.latitude, longitude: incident.longitude }}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={MAP_SETTINGS.routeStrokeWidth}
            strokeColor={MAP_SETTINGS.routeStrokeColor}
            optimizeWaypoints={true}
            onReady={(result) => {
              setDistance(`${result.distance.toFixed(1)} km`);
              setDuration(`${Math.round(result.duration)} min`);
            }}
            onError={(error) => {
              console.error('Directions error:', error);
            }}
          />
        )}

        {/* Route directions - OpenRouteService */}
        {routingProvider === 'openroute' && orsRoute && (
          <Polyline
            coordinates={orsRoute.coordinates}
            strokeWidth={MAP_SETTINGS.routeStrokeWidth}
            strokeColor={MAP_SETTINGS.routeStrokeColor}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <View style={styles.incidentHeader}>
          <View style={styles.incidentInfo}>
            <Text style={styles.incidentType}>
              {incident.type.toUpperCase().replace('_', ' ')}
            </Text>
            {dispatch && (
              <Text style={styles.dispatchId}>Dispatch #{dispatch.id}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.externalNavButton} onPress={openInExternalMaps}>
            <Ionicons name="navigate" size={20} color={Colors.textWhite} />
          </TouchableOpacity>
        </View>

        <Text style={styles.address} numberOfLines={2}>
          {incident.address}
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{distance || dispatch?.distance_text || 'Calculating...'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ETA</Text>
            <Text style={styles.statValue}>{duration || dispatch?.duration_text || 'Calculating...'}</Text>
          </View>
        </View>

        {/* Turn-by-turn navigation (OpenRouteService only) */}
        {routingProvider === 'openroute' && orsRoute && orsRoute.steps.length > 0 && (
          <View style={styles.turnByTurnContainer}>
            <TouchableOpacity
              style={styles.turnByTurnHeader}
              onPress={() => setShowTurnByTurn(!showTurnByTurn)}
            >
              <View style={styles.turnByTurnHeaderLeft}>
                <Ionicons name="navigate" size={20} color="#3B82F6" />
                <Text style={styles.turnByTurnTitle}>
                  Turn-by-Turn Directions ({orsRoute.steps.length} steps)
                </Text>
              </View>
              <Ionicons
                name={showTurnByTurn ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>

            {showTurnByTurn && (
              <View style={styles.turnByTurnSteps}>
                {orsRoute.steps.slice(0, 8).map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepInstruction}>{step.instruction}</Text>
                      <Text style={styles.stepDistance}>
                        {OpenRouteService.formatDistance(step.distance)}
                      </Text>
                    </View>
                  </View>
                ))}
                {orsRoute.steps.length > 8 && (
                  <Text style={styles.moreSteps}>
                    + {orsRoute.steps.length - 8} more steps
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        {statusButtonConfig && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: statusButtonConfig.color }]}
            onPress={() => handleStatusUpdate(statusButtonConfig.status)}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? (
              <ActivityIndicator color={Colors.textWhite} />
            ) : (
              <>
                <Text style={styles.actionButtonText}>{statusButtonConfig.label}</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.textWhite} />
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Routing provider info & controls */}
        <View style={styles.routingControls}>
          <View style={styles.providerInfo}>
            <Text style={styles.providerLabel}>
              {routingProvider === 'google' ? 'Google Maps' : 'OpenRouteService'}
            </Text>
            {routingProvider === 'openroute' && isLoadingRoute && (
              <ActivityIndicator size="small" color="#3B82F6" style={{ marginLeft: 8 }} />
            )}
          </View>
          <View style={styles.routingButtons}>
            {routingProvider === 'openroute' && (
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchOpenRouteServiceRoute}
                disabled={isLoadingRoute}
              >
                <Ionicons name="refresh" size={16} color="#3B82F6" />
              </TouchableOpacity>
            )}
            {isGoogleMapsConfigured() && (
              <TouchableOpacity
                style={styles.switchProviderButton}
                onPress={() => setRoutingProvider(routingProvider === 'google' ? 'openroute' : 'google')}
              >
                <Ionicons name="swap-horizontal" size={16} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Warnings */}
        {routingProvider === 'google' && !isGoogleMapsConfigured() && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={16} color="#F59E0B" />
            <Text style={styles.warningText}>
              Configure Google Maps API key or switch to OpenRouteService
            </Text>
          </View>
        )}
        {routingProvider === 'openroute' && !isOpenRouteServiceConfigured() && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={16} color="#F59E0B" />
            <Text style={styles.warningText}>
              Configure OpenRouteService API key in .env
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
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
    fontWeight: "600",
  },
  backButtonFloating: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  currentLocationMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  incidentMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  infoPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.textWhite,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  incidentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  incidentInfo: {
    flex: 1,
  },
  incidentType: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  dispatchId: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  externalNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  address: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  actionButton: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: Colors.textWhite,
    fontSize: FontSizes.md,
    fontWeight: "bold",
  },
  warningBanner: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: "#FEF3C7",
    borderRadius: BorderRadius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: "#92400E",
  },
  turnByTurnContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: "#EFF6FF",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  turnByTurnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  turnByTurnHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  turnByTurnTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: "#3B82F6",
  },
  turnByTurnSteps: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  stepNumberText: {
    color: Colors.textWhite,
    fontSize: FontSizes.xs,
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: FontSizes.sm,
    color: "#1E40AF",
    marginBottom: 4,
  },
  stepDistance: {
    fontSize: FontSizes.xs,
    color: "#64748B",
  },
  moreSteps: {
    fontSize: FontSizes.xs,
    color: "#64748B",
    fontStyle: "italic",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  routingControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  providerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  providerLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  routingButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  switchProviderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
});

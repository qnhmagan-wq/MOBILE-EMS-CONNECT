/**
 * Map Overview Screen
 *
 * Shows an overview map with:
 * - Responder's current location (blue dot with continuous tracking)
 * - Active incident markers (red pins with incident type icons)
 * - Tap incident markers to show callout with incident details
 * - Real-time location updates every 5 seconds or 10 meters
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, StyleSheet, SafeAreaView, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { PROVIDER_GOOGLE, Marker, Region } from "react-native-maps";
import DeferredMapView from "@/components/DeferredMapView";
import * as Location from "expo-location";
import * as locationService from "@/src/services/location.service";
import * as stationService from "@/src/services/station.service";
import { Station } from "@/src/types/station.types";
import { useDispatch } from "@/src/contexts/DispatchContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { applyJitterForOverlaps } from "@/src/utils/coordinates";

export default function MapOverviewScreen() {
  const { activeDispatches } = useDispatch();

  // Offset markers that share identical coordinates on a ~6m ring so a second
  // report from the same spot doesn't hide under the first one. Keyed by
  // dispatch id, so pins remain independently tappable.
  //
  // Coords are coerced to Number up front so Laravel DECIMAL-as-string values
  // don't cause `.toFixed` to throw inside `applyJitterForOverlaps`. Dispatches
  // without a valid incident payload are filtered out before jitter — which is
  // safe because the jitter invariant is "never drop input elements", not "never
  // reject bad upstream data".
  const dispatchMarkers = useMemo(() => {
    const before = activeDispatches
      .filter((d) => d.incident)
      .map((d) => ({
        id: d.id,
        latitude: Number(d.incident.latitude),
        longitude: Number(d.incident.longitude),
        dispatch: d,
      }));
    const jittered = applyJitterForOverlaps(before);
    // [MAP DEBUG] Diagnostic log for incident pin regression. The jitter
    // helper's documented invariant is that output length === input length;
    // logging both sides makes it trivial to confirm in logcat / Xcode console.
    const summarize = (arr: typeof before) =>
      arr.map((m) => ({ id: m.id, lat: m.latitude, lon: m.longitude }));
    console.log('[MAP DEBUG] markers before jitter:', JSON.stringify(summarize(before)));
    console.log('[MAP DEBUG] markers after jitter:', JSON.stringify(summarize(jittered)));
    if (jittered.length !== before.length) {
      console.error(
        '[MAP DEBUG] JITTER DROPPED ELEMENTS — this violates the invariant',
        { beforeLen: before.length, afterLen: jittered.length }
      );
    }
    return jittered;
  }, [activeDispatches]);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);

  const mapRef = useRef<import("react-native-maps").default>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const mountedRef = useRef(true);

  const setLocationFromUpdate = useCallback((update: { latitude: number; longitude: number }) => {
    const loc = {
      coords: { latitude: update.latitude, longitude: update.longitude, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null },
      timestamp: Date.now(),
    } as Location.LocationObject;
    setLocation(loc);
    setRegion({
      latitude: update.latitude,
      longitude: update.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  }, []);

  /**
   * Setup location tracking
   */
  const setupLocationTracking = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[Map Overview] Requesting location permission...');
      const permResult = await locationService.requestLocationPermissions();

      if (!permResult.granted) {
        if (mountedRef.current) {
          setError('Location permission denied. Please enable location access in your device settings.');
          setIsLoading(false);
        }
        return;
      }

      // Get initial location with timeout
      console.log('[Map Overview] Getting initial location...');
      try {
        const initialUpdate = await locationService.getCurrentLocation(10000);
        if (mountedRef.current) {
          setLocationFromUpdate(initialUpdate);
          setIsLoading(false);
          console.log('[Map Overview] Initial location:', initialUpdate);

          // Fetch nearby stations (non-blocking)
          stationService.getNearbyStations(initialUpdate.latitude, initialUpdate.longitude, 50)
            .then((res) => { if (mountedRef.current) setStations(res.stations || []); })
            .catch((err) => console.warn('[Map Overview] Failed to load stations:', err.message));
        }
      } catch (locErr: any) {
        console.warn('[Map Overview] getCurrentLocation failed, trying last known:', locErr.message);
        // Fallback to last known location
        const lastKnown = locationService.getLastKnownLocation();
        if (lastKnown && mountedRef.current) {
          setLocationFromUpdate(lastKnown);
          setIsLoading(false);
          console.log('[Map Overview] Using last known location:', lastKnown);
        } else if (mountedRef.current) {
          setError(locationService.getLocationErrorMessage(locErr));
          setIsLoading(false);
          return;
        }
      }

      // Start continuous tracking
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (newLocation) => {
          if (mountedRef.current) {
            setLocation(newLocation);
          }
        }
      );

      console.log('[Map Overview] Continuous tracking started');
    } catch (err: any) {
      console.error('[Map Overview] Location error:', err);
      if (mountedRef.current) {
        setError(locationService.getLocationErrorMessage(err));
        setIsLoading(false);
      }
    }
  }, [setLocationFromUpdate]);

  useEffect(() => {
    mountedRef.current = true;
    setupLocationTracking();

    return () => {
      mountedRef.current = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        console.log('[Map Overview] Location tracking stopped');
      }
    };
  }, [setupLocationTracking]);

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
            <TouchableOpacity style={styles.retryButton} onPress={setupLocationTracking}>
              <Ionicons name="refresh" size={20} color={Colors.textWhite} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <DeferredMapView
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
          {/* Active Incident Markers (jittered when stacked at identical coords).
              Named `pinColor="red"` + high `zIndex` — see route-map.tsx for
              the full reasoning; same Android rendering gotcha applies here. */}
          {dispatchMarkers.map(({ id, latitude, longitude, dispatch }) => (
            <Marker
              key={`dispatch-${id}`}
              identifier={`dispatch-${id}`}
              coordinate={{ latitude, longitude }}
              pinColor="red"
              zIndex={9999}
              title={`${dispatch.incident.type.charAt(0).toUpperCase() + dispatch.incident.type.slice(1).replace('_', ' ')} Emergency`}
              description={`${dispatch.incident.address}\nStatus: ${dispatch.status.toUpperCase().replace('_', ' ')}`}
              tracksViewChanges={false}
            />
          ))}

          {/* Fire Station Markers */}
          {stations.filter(s => s.category === 'fire_station').map((station) => (
            <Marker
              key={`fire-${station.id}`}
              coordinate={{ latitude: station.latitude, longitude: station.longitude }}
              title={station.name}
              description={`${station.type} — ${station.address}`}
              tracksViewChanges={false}
            >
              <View style={styles.fireStationMarker}>
                <Ionicons name="flame" size={16} color="#fff" />
              </View>
            </Marker>
          ))}

          {/* Police Station Markers */}
          {stations.filter(s => s.category === 'police_station').map((station) => (
            <Marker
              key={`police-${station.id}`}
              coordinate={{ latitude: station.latitude, longitude: station.longitude }}
              title={station.name}
              description={`${station.type} — ${station.address}`}
              tracksViewChanges={false}
            >
              <View style={styles.policeStationMarker}>
                <Ionicons name="shield" size={16} color="#fff" />
              </View>
            </Marker>
          ))}
        </DeferredMapView>

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
          {stations.length > 0 && (
            <Text style={styles.noIncidentsText}>
              {stations.filter(s => s.category === 'fire_station').length} fire station{stations.filter(s => s.category === 'fire_station').length !== 1 ? 's' : ''}, {stations.filter(s => s.category === 'police_station').length} police station{stations.filter(s => s.category === 'police_station').length !== 1 ? 's' : ''} nearby
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
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  retryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textWhite,
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
  fireStationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  policeStationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

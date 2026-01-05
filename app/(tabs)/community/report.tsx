import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useIncidentTracking } from '@/src/hooks/useIncidentTracking';
import { Incident } from '@/src/types/incident.types';
import { ResponderTracking } from '@/src/types/tracking.types';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/src/config/theme';
import { isValidCoordinate, DEFAULT_COORDINATE } from '@/src/utils/coordinates';
import * as incidentService from '@/src/services/incident.service';

export default function MapsScreen() {
  const params = useLocalSearchParams();
  const focusIncidentId = params.focus ? parseInt(params.focus as string) : null;

  // State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);

  const {
    trackingData,
    isLoading: isLoadingTracking,
    isPolling,
    error: trackingError,
    startTracking,
    stopTracking,
    refreshTracking,
  } = useIncidentTracking();

  const mapRef = useRef<MapView>(null);

  /**
   * Fetch user's active incidents on mount
   */
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const fetchedIncidents = await incidentService.getIncidents();
        // Filter only active incidents
        const activeIncidents = fetchedIncidents.filter((inc) =>
          ['pending', 'dispatched', 'in_progress'].includes(inc.status)
        );
        setIncidents(activeIncidents);

        // Handle focus parameter (from incident details)
        if (focusIncidentId) {
          const focusedIncident = activeIncidents.find((inc) => inc.id === focusIncidentId);
          if (focusedIncident) {
            handleIncidentSelect(focusedIncident);
          }
        }
        // Auto-select if only one incident
        else if (activeIncidents.length === 1) {
          handleIncidentSelect(activeIncidents[0]);
        }
      } catch (error: any) {
        console.error('[MapsScreen] Failed to load incidents:', error);
        Alert.alert('Error', 'Failed to load incidents. Please try again.');
      } finally {
        setIsLoadingIncidents(false);
      }
    };

    fetchIncidents();

    // Cleanup: Stop tracking when unmounting
    return () => {
      stopTracking();
    };
  }, [focusIncidentId]);

  /**
   * Auto-zoom map when tracking data updates
   */
  useEffect(() => {
    if (trackingData && selectedIncident && mapRef.current) {
      fitMapToMarkers();
    }
  }, [trackingData, selectedIncident]);

  /**
   * Select an incident and start tracking its responders
   */
  const handleIncidentSelect = (incident: Incident) => {
    console.log('[MapsScreen] Selecting incident:', incident.id);
    setSelectedIncident(incident);
    startTracking(incident.id);

    // Animate map to incident location
    if (mapRef.current && isValidCoordinate(incident)) {
      mapRef.current.animateToRegion({
        latitude: incident.latitude,
        longitude: incident.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  };

  /**
   * Fit map to show all relevant markers (incident + responders)
   */
  const fitMapToMarkers = () => {
    if (!trackingData || !selectedIncident || !mapRef.current) return;

    const coordinates = [];

    // Add incident location
    if (isValidCoordinate(selectedIncident)) {
      coordinates.push({
        latitude: selectedIncident.latitude,
        longitude: selectedIncident.longitude,
      });
    }

    // Add responder locations
    trackingData.responders.forEach((responder) => {
      if (responder.current_location && isValidCoordinate(responder.current_location)) {
        coordinates.push({
          latitude: responder.current_location.latitude,
          longitude: responder.current_location.longitude,
        });
      }
    });

    if (coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

  /**
   * Handle call responder button
   */
  const handleCallResponder = (phoneNumber: string, name: string) => {
    Alert.alert(
      'Call Responder',
      `Call ${name} at ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`);
          },
        },
      ]
    );
  };

  /**
   * Get icon name for incident type
   */
  const getIncidentIcon = (type: string): keyof typeof Ionicons.glyphMap => {
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

  // Loading state
  if (isLoadingIncidents) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading incidents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No active incidents
  if (incidents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Maps</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Active Incidents</Text>
          <Text style={styles.emptyText}>
            You don't have any active incidents to track.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determine initial map region
  const initialRegion: Region = selectedIncident && isValidCoordinate(selectedIncident)
    ? {
        latitude: selectedIncident.latitude,
        longitude: selectedIncident.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : incidents[0] && isValidCoordinate(incidents[0])
    ? {
        latitude: incidents[0].latitude,
        longitude: incidents[0].longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : {
        latitude: DEFAULT_COORDINATE.latitude,
        longitude: DEFAULT_COORDINATE.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Responder Tracking</Text>
          <Text style={styles.headerSubtitle}>
            {incidents.length} active incident{incidents.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={selectedIncident ? refreshTracking : undefined}
          disabled={!selectedIncident}
        >
          <Ionicons
            name="refresh"
            size={24}
            color={selectedIncident ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Render all incident markers */}
        {incidents.map((incident) => {
          if (!isValidCoordinate(incident)) return null;

          const isSelected = selectedIncident?.id === incident.id;

          return (
            <Marker
              key={`incident-${incident.id}`}
              coordinate={{
                latitude: incident.latitude,
                longitude: incident.longitude,
              }}
              onPress={() => handleIncidentSelect(incident)}
            >
              <View
                style={[
                  styles.incidentMarker,
                  isSelected && styles.incidentMarkerSelected,
                ]}
              >
                <Ionicons
                  name={getIncidentIcon(incident.type)}
                  size={isSelected ? 28 : 24}
                  color="#fff"
                />
              </View>
            </Marker>
          );
        })}

        {/* Render responder routes (all Polylines) */}
        {trackingData &&
          selectedIncident &&
          trackingData.responders.map((responder) =>
            responder.route &&
            responder.route.coordinates &&
            responder.route.coordinates.length > 0 ? (
              <Polyline
                key={`route-${responder.id}`}
                coordinates={responder.route.coordinates}
                strokeColor={Colors.responderPrimary}
                strokeWidth={4}
                lineDashPattern={[1]}
              />
            ) : null
          )}

        {/* Render responder markers (all Markers) */}
        {trackingData &&
          selectedIncident &&
          trackingData.responders.map((responder) =>
            responder.current_location &&
            isValidCoordinate(responder.current_location) ? (
              <Marker
                key={`marker-${responder.id}`}
                coordinate={{
                  latitude: responder.current_location.latitude,
                  longitude: responder.current_location.longitude,
                }}
                title={responder.name}
                description={`ETA: ${responder.eta?.text || 'Calculating...'}`}
              >
                <View style={styles.responderMarker}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
              </Marker>
            ) : null
          )}
      </MapView>

      {/* Polling Indicator */}
      {isPolling && (
        <View style={styles.pollingIndicator}>
          <View style={styles.pollingDot} />
          <Text style={styles.pollingText}>Live Tracking</Text>
        </View>
      )}

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <ScrollView
          style={styles.bottomSheetScroll}
          contentContainerStyle={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
        >
          {/* No incident selected */}
          {!selectedIncident && (
            <View style={styles.promptContainer}>
              <Ionicons name="hand-left-outline" size={32} color={Colors.primary} />
              <Text style={styles.promptTitle}>Select an Incident</Text>
              <Text style={styles.promptText}>
                Tap an incident marker on the map to view responder tracking
              </Text>
            </View>
          )}

          {/* Loading tracking data */}
          {selectedIncident && isLoadingTracking && (
            <View style={styles.loadingTrackingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingTrackingText}>Loading tracking data...</Text>
            </View>
          )}

          {/* Tracking error */}
          {selectedIncident && trackingError && (
            <View style={styles.errorTrackingContainer}>
              <Ionicons name="alert-circle" size={32} color={Colors.danger} />
              <Text style={styles.errorTrackingText}>{trackingError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refreshTracking}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tracking not available */}
          {selectedIncident && trackingData && !trackingData.tracking_available && (
            <View style={styles.notAvailableContainer}>
              <Ionicons name="information-circle" size={32} color={Colors.info} />
              <Text style={styles.notAvailableTitle}>Tracking Unavailable</Text>
              <Text style={styles.notAvailableText}>
                {trackingData.message || 'Tracking is not available for this incident.'}
              </Text>
            </View>
          )}

          {/* Responder cards */}
          {selectedIncident &&
            trackingData &&
            trackingData.tracking_available &&
            trackingData.responders.length > 0 &&
            trackingData.responders.map((responder) => (
              <View key={responder.id} style={styles.responderCard}>
                <View style={styles.responderHeader}>
                  <View style={styles.responderInfo}>
                    <Ionicons
                      name="person-circle"
                      size={40}
                      color={Colors.responderPrimary}
                    />
                    <View style={styles.responderDetails}>
                      <Text style={styles.responderName}>{responder.name}</Text>
                      <Text style={styles.responderStatus}>
                        Status: {responder.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCallResponder(responder.phone_number, responder.name)}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.callButtonText}>Call</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.responderMetrics}>
                  {responder.eta && (
                    <View style={styles.metric}>
                      <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.metricText}>ETA: {responder.eta.text}</Text>
                    </View>
                  )}
                  {responder.distance && (
                    <View style={styles.metric}>
                      <Ionicons name="navigate-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.metricText}>{responder.distance.text} away</Text>
                    </View>
                  )}
                  {!responder.current_location && (
                    <View style={styles.metric}>
                      <Ionicons name="location-outline" size={16} color={Colors.warning} />
                      <Text style={[styles.metricText, { color: Colors.warning }]}>
                        Location unavailable
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

          {/* No responders yet */}
          {selectedIncident &&
            trackingData &&
            trackingData.tracking_available &&
            trackingData.responders.length === 0 && (
              <View style={styles.noRespondersContainer}>
                <Ionicons name="people-outline" size={32} color={Colors.textSecondary} />
                <Text style={styles.noRespondersText}>
                  No responders assigned yet. Please wait...
                </Text>
              </View>
            )}
        </ScrollView>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  incidentMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  incidentMarkerSelected: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  responderMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.responderPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pollingIndicator: {
    position: 'absolute',
    top: 80,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pollingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: Spacing.xs,
  },
  pollingText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetScroll: {
    flex: 1,
  },
  bottomSheetContent: {
    padding: Spacing.lg,
  },
  promptContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  promptTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  promptText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  loadingTrackingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingTrackingText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  errorTrackingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  errorTrackingText: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  notAvailableContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  notAvailableTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  notAvailableText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  responderCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  responderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  responderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  responderDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  responderName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  responderStatus: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  callButtonText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  responderMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metricText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  noRespondersContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noRespondersText: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

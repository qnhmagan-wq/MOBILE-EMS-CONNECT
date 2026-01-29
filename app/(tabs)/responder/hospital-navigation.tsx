import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSizes } from "@/src/config/theme";
import { useDispatch } from "@/src/contexts/DispatchContext";
import { Dispatch, HospitalRouteData } from "@/src/types/dispatch.types";
import { scale, scaleFontSize, scaleSpacing } from "@/src/utils/responsive";
import * as dispatchService from "@/src/services/dispatch.service";

export default function HospitalNavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatchId = params.dispatchId ? parseInt(params.dispatchId as string) : null;
  const { dispatches, updateDispatchStatus } = useDispatch();

  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [hospitalRoute, setHospitalRoute] = useState<HospitalRouteData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const mapRef = useRef<MapView>(null);
  const locationWatchId = useRef<Location.LocationSubscription | null>(null);

  // Load dispatch and hospital route
  useEffect(() => {
    const loadDispatchData = async () => {
      if (!dispatchId) {
        Alert.alert('Error', 'No dispatch ID provided');
        router.back();
        return;
      }

      // Find dispatch from context
      const found = dispatches.find(d => d.id === dispatchId);
      if (!found) {
        Alert.alert('Error', 'Dispatch not found');
        router.back();
        return;
      }

      setDispatch(found);

      // Check if hospital route data exists
      if (found.hospital_route) {
        setHospitalRoute(found.hospital_route);
        setIsLoading(false);
      } else {
        // Fetch hospital route if not available
        try {
          const routeData = await dispatchService.getHospitalRoute(dispatchId);
          setHospitalRoute(routeData);
          setIsLoading(false);
        } catch (error: any) {
          console.error('[Hospital Navigation] Failed to load route:', error);
          Alert.alert(
            'Error',
            'Failed to load hospital route. Please try again.',
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
        }
      }
    };

    loadDispatchData();
  }, [dispatchId, dispatches]);

  // Start GPS tracking
  useEffect(() => {
    let isMounted = true;

    const startLocationTracking = async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required for navigation.');
          return;
        }

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (isMounted) {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }

        // Watch location updates
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // Update every 10 meters
            timeInterval: 10000, // Update every 10 seconds
          },
          (newLocation) => {
            if (isMounted) {
              setCurrentLocation({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              });

              // Update backend with current location
              dispatchService.updateLocation({
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
              }).catch(error => {
                console.error('[Hospital Navigation] Location update failed:', error);
              });
            }
          }
        );

        locationWatchId.current = subscription;
      } catch (error) {
        console.error('[Hospital Navigation] Location tracking error:', error);
      }
    };

    startLocationTracking();

    return () => {
      isMounted = false;
      if (locationWatchId.current) {
        locationWatchId.current.remove();
      }
    };
  }, []);

  // Auto-fit map to show route
  useEffect(() => {
    if (mapRef.current && hospitalRoute && currentLocation) {
      const coordinates = [
        currentLocation,
        ...hospitalRoute.route.coordinates,
        {
          latitude: hospitalRoute.hospital.latitude,
          longitude: hospitalRoute.hospital.longitude,
        },
      ];

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
        animated: true,
      });
    }
  }, [hospitalRoute, currentLocation]);

  const callHospital = () => {
    if (!hospitalRoute) return;
    const phoneNumber = hospitalRoute.hospital.phone_number;
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openInMaps = () => {
    if (!hospitalRoute) return;
    const { latitude, longitude } = hospitalRoute.hospital;

    if (Platform.OS === 'ios') {
      Linking.openURL(
        `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`
      );
    } else {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`
      );
    }
  };

  const completeDispatch = async () => {
    if (!dispatch) return;

    Alert.alert(
      'Complete Dispatch',
      'Have you arrived at the hospital?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setIsCompleting(true);
            try {
              await updateDispatchStatus(dispatch.id, 'completed');

              Alert.alert(
                'Success',
                'Dispatch completed successfully',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate back to responder home
                      router.replace('/(tabs)/responder/home');
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('[Hospital Navigation] Complete dispatch error:', error);
              Alert.alert('Error', 'Failed to complete dispatch. Please try again.');
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading hospital route...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hospitalRoute) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Hospital route unavailable</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Navigation</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: hospitalRoute.hospital.latitude,
          longitude: hospitalRoute.hospital.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor="#3B82F6"
          >
            <View style={styles.currentLocationMarker}>
              <Ionicons name="navigate" size={20} color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* Hospital Marker */}
        <Marker
          coordinate={{
            latitude: hospitalRoute.hospital.latitude,
            longitude: hospitalRoute.hospital.longitude,
          }}
          title={hospitalRoute.hospital.name}
          description={hospitalRoute.hospital.address}
        >
          <View style={styles.hospitalMarker}>
            <Ionicons name="medical" size={24} color="#FFFFFF" />
          </View>
        </Marker>

        {/* Route Polyline */}
        <Polyline
          coordinates={hospitalRoute.route.coordinates}
          strokeColor="#3B82F6"
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
      </MapView>

      {/* Hospital Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.hospitalName}>
          {hospitalRoute.hospital.name}
        </Text>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color={Colors.textSecondary} />
          <Text style={styles.address}>
            {hospitalRoute.hospital.address}
          </Text>
        </View>
        <View style={styles.distanceRow}>
          <Ionicons name="navigate" size={18} color="#3B82F6" />
          <Text style={styles.distanceText}>
            {hospitalRoute.route.distance_text} • {hospitalRoute.route.duration_text}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={callHospital}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Call Hospital</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.mapsButton]}
            onPress={openInMaps}
          >
            <Ionicons name="map" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Open in Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={completeDispatch}
            disabled={isCompleting}
          >
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {isCompleting ? 'Completing...' : 'Complete at Hospital'}
            </Text>
            {isCompleting && <ActivityIndicator color="#FFFFFF" size="small" />}
          </TouchableOpacity>
        </View>
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
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
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
  header: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: scaleFontSize(18),
    fontWeight: "600",
    color: Colors.textWhite,
  },
  placeholder: {
    width: 40,
  },
  map: {
    flex: 1,
  },
  currentLocationMarker: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hospitalMarker: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: scaleSpacing(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  hospitalName: {
    fontSize: scaleFontSize(22),
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: scaleSpacing(8),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleSpacing(8),
    marginBottom: scaleSpacing(8),
  },
  address: {
    fontSize: scaleFontSize(14),
    color: Colors.textSecondary,
    flex: 1,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scaleSpacing(8),
    marginBottom: scaleSpacing(20),
  },
  distanceText: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#3B82F6",
  },
  actionsContainer: {
    gap: scaleSpacing(12),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scaleSpacing(8),
    padding: scaleSpacing(16),
    borderRadius: scale(12),
  },
  callButton: {
    backgroundColor: "#10B981",
  },
  mapsButton: {
    backgroundColor: "#3B82F6",
  },
  completeButton: {
    backgroundColor: "#8B2A2A",
  },
  actionButtonText: {
    fontSize: scaleFontSize(16),
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

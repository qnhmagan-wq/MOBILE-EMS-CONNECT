/**
 * Route Map Screen - SIMPLE TEST VERSION
 *
 * Purpose: Test if map rendering works independently of backend
 * This is the simplest possible map implementation to isolate issues.
 *
 * Features:
 * - OpenStreetMap tiles (PROVIDER_DEFAULT)
 * - User location (blue dot)
 * - Location coordinates display
 * - No backend integration
 * - No dispatch/incident data
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet, SafeAreaView, Text } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RouteMapScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        console.log('[Route Map] Requesting location permission...');

        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('[Route Map] Permission status:', status);

        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }

        // Get location
        console.log('[Route Map] Getting current location...');
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        console.log('[Route Map] Location received:', loc.coords);

        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
      } catch (err: any) {
        console.error('[Route Map] Error:', err);
        setError(err.message || 'Failed to get location');
      }
    })();
  }, []);

  console.log('[Route Map] Rendering. Location:', location, 'Error:', error);

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: location?.latitude || 14.5995, // Manila default
            longitude: location?.longitude || 120.9842,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}

        {location && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📍 Test Map: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
            <Text style={styles.infoSubtext}>
              This is a simple map test without backend integration
            </Text>
          </View>
        )}

        {/* Status indicator */}
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>
            {location ? '✅ Map Working' : error ? '❌ Map Error' : '⏳ Loading...'}
          </Text>
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
  errorBox: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: 'white',
    fontWeight: '600',
  },
  infoBox: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSubtext: {
    color: 'white',
    fontSize: 10,
    marginTop: 4,
    opacity: 0.9,
  },
  statusBox: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

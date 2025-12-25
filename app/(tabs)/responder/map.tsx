

import React, { useState, useEffect } from "react";
import { View, StyleSheet, SafeAreaView, Text } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function NavigationMapScreen() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        console.log('[Map] Requesting location permission...');

        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('[Map] Permission status:', status);

        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }

        // Get location
        console.log('[Map] Getting current location...');
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        console.log('[Map] Location received:', loc.coords);

        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
      } catch (err) {
        console.error('[Map] Error:', err);
        setError(err.message || 'Failed to get location');
      }
    })();
  }, []);

  console.log('[Map] Rendering. Location:', location, 'Error:', error);

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
              Your location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          </View>
        )}
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
    bottom: 20,
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
});

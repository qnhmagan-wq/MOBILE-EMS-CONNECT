/**
 * Maps Configuration
 *
 * Configuration for Google Maps and OpenRouteService integration
 */

/**
 * Google Maps API Key
 *
 * IMPORTANT: Replace with your actual Google Maps API key from:
 * https://console.cloud.google.com/google/maps-apis
 *
 * Required APIs to enable:
 * - Maps SDK for Android
 * - Maps SDK for iOS
 * - Directions API
 * - Distance Matrix API
 */
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

/**
 * OpenRouteService API Key
 *
 * Free alternative to Google Directions API
 * Get your free API key from: https://openrouteservice.org/dev/#/signup
 *
 * Features:
 * - 2,000 requests/day (free tier)
 * - Driving directions
 * - Turn-by-turn navigation
 * - Geocoding & reverse geocoding
 * - Distance matrix
 */
export const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY || '5b3ce3597851100001cf62848';

/**
 * Routing provider preference
 */
export type RoutingProvider = 'google' | 'openroute';
export const ROUTING_PROVIDER: RoutingProvider = 'openroute'; // Default to OpenRouteService (free)

/**
 * Map display settings
 */
export const MAP_SETTINGS = {
  // Default map region (Philippines - adjust as needed)
  defaultRegion: {
    latitude: 14.5995,
    longitude: 120.9842,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },

  // Route styling
  routeStrokeWidth: 4,
  routeStrokeColor: '#3B82F6', // Blue

  // Auto-arrival detection
  arrivalDistanceThreshold: 0.1, // 100 meters in km
  arrivalCheckInterval: 5000, // Check every 5 seconds

  // Location tracking
  locationUpdateInterval: 5000, // 5 seconds
  locationDistanceFilter: 10, // 10 meters

  // Map padding for route fitting
  routePadding: {
    top: 100,
    right: 50,
    bottom: 300,
    left: 50,
  },
};

/**
 * Marker colors for different statuses
 */
export const MARKER_COLORS = {
  currentLocation: 'blue',
  incident: 'red',
  responder: 'green',
};

/**
 * Check if Google Maps API key is configured
 */
export const isGoogleMapsConfigured = (): boolean => {
  return GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' && GOOGLE_MAPS_API_KEY.length > 0;
};

/**
 * Check if OpenRouteService API key is configured
 */
export const isOpenRouteServiceConfigured = (): boolean => {
  return ORS_API_KEY.length > 0 && ORS_API_KEY !== 'YOUR_ORS_API_KEY_HERE';
};

/**
 * Get the active routing provider based on configuration
 */
export const getActiveRoutingProvider = (): RoutingProvider => {
  if (ROUTING_PROVIDER === 'google' && isGoogleMapsConfigured()) {
    return 'google';
  }
  if (isOpenRouteServiceConfigured()) {
    return 'openroute';
  }
  return ROUTING_PROVIDER;
};

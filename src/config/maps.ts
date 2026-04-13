/**
 * Maps Configuration
 *
 * Configuration for OpenRouteService integration (SYNCED WITH BACKEND)
 * ⚠️ IMPORTANT: Uses same ORS API key as Laravel backend
 */

/**
 * OpenRouteService API Key
 *
 * SYNCED WITH BACKEND - Same key used by Laravel
 * This ensures shared 2,000 requests/day quota and consistent routing
 *
 * Features:
 * - 2,000 requests/day (shared with backend)
 * - 40 requests/minute
 * - Driving directions with turn-by-turn
 * - Geocoding & reverse geocoding
 * - FREE (no credit card required)
 */
export const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMDAwMDFjZjYyNDgiLCJpZCI6IjJkNzNkOGU3YzgwMDQ3NDY5ZmQ1OGMwZjJlNmQ0NmY5IiwiaCI6Im11cm11cjY0In0=';

/**
 * OpenRouteService Base URL
 */
export const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';

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
  fireStation: '#ef4444',
  policeStation: '#6366f1',
  hospitalGovernment: '#22c55e',
  hospitalPrivate: '#3b82f6',
  hospitalHealthCenter: '#f59e0b',
};

/**
 * Check if OpenRouteService API key is configured
 */
export const isOpenRouteServiceConfigured = (): boolean => {
  return ORS_API_KEY.length > 0;
};

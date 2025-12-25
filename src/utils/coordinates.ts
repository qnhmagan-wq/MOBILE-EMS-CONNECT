/**
 * Coordinate Validation Utilities
 *
 * Provides type-safe validation for GPS coordinates to prevent crashes
 * from null/undefined/invalid coordinate access.
 *
 * Critical for preventing map rendering crashes in React Native Maps.
 */

/**
 * Type guard to validate coordinate object
 *
 * Checks for:
 * - Non-null/undefined object
 * - Numeric latitude and longitude
 * - No NaN values
 * - Valid GPS ranges (-90 to 90 for latitude, -180 to 180 for longitude)
 *
 * @param coord - Coordinate object to validate
 * @returns True if coordinate is valid and safe to use
 */
export const isValidCoordinate = (
  coord: { latitude?: number; longitude?: number } | null | undefined
): coord is { latitude: number; longitude: number } => {
  if (!coord) return false;

  const { latitude, longitude } = coord;

  // Must be numbers
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;

  // Must not be NaN
  if (isNaN(latitude) || isNaN(longitude)) return false;

  // Must be within valid GPS ranges
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;

  return true;
};

/**
 * Validates that an incident object has valid coordinates
 *
 * Used before rendering map markers or calculating routes
 *
 * @param incident - Incident object to validate
 * @returns True if incident exists and has valid coordinates
 */
export const hasValidIncidentCoordinates = (incident: any): boolean => {
  return incident && isValidCoordinate({
    latitude: incident.latitude,
    longitude: incident.longitude
  });
};

/**
 * Gets coordinate or fallback to safe default
 *
 * Useful for MapView initialRegion where a valid coordinate is always required
 *
 * @param coord - Coordinate to validate
 * @param fallback - Safe fallback coordinate
 * @returns Valid coordinate (original or fallback)
 */
export const getSafeCoordinate = (
  coord: { latitude?: number; longitude?: number } | null | undefined,
  fallback: { latitude: number; longitude: number }
): { latitude: number; longitude: number } => {
  return isValidCoordinate(coord) ? coord : fallback;
};

/**
 * Default fallback coordinate (Manila, Philippines - EMS Connect default region)
 */
export const DEFAULT_COORDINATE = {
  latitude: 14.5995,
  longitude: 120.9842,
};

/**
 * Validates that a polyline coordinate array is valid
 *
 * Used for route rendering to ensure all points are valid
 *
 * @param coordinates - Array of coordinate objects
 * @returns True if all coordinates in array are valid
 */
export const areValidPolylineCoordinates = (
  coordinates: Array<{ latitude?: number; longitude?: number }> | null | undefined
): coordinates is Array<{ latitude: number; longitude: number }> => {
  if (!coordinates || !Array.isArray(coordinates)) return false;
  if (coordinates.length === 0) return false;
  return coordinates.every(coord => isValidCoordinate(coord));
};

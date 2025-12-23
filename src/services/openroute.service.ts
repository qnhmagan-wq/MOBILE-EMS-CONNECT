/**
 * OpenRouteService API Integration
 *
 * Provides routing, directions, and geocoding services using OpenRouteService API.
 * Free alternative to Google Maps Directions API.
 *
 * API Documentation: https://openrouteservice.org/dev/#/api-docs
 */

import axios, { AxiosInstance } from 'axios';

/**
 * OpenRouteService API Configuration
 */
const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY || '5b3ce3597851100001cf62848';
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';

/**
 * Route coordinate (latitude, longitude)
 */
export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Turn-by-turn navigation step
 */
export interface RouteStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  type: number;
  name: string;
  wayPoints: number[];
}

/**
 * Route summary information
 */
export interface RouteSummary {
  distance: number; // meters
  duration: number; // seconds
}

/**
 * Complete route result
 */
export interface RouteResult {
  coordinates: RouteCoordinate[]; // Array of lat/lon points
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
  summary: RouteSummary;
}

/**
 * Geocoding result
 */
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  confidence: number;
}

/**
 * Distance matrix result
 */
export interface DistanceMatrixResult {
  distances: number[][]; // meters
  durations: number[][]; // seconds
}

class OpenRouteService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: ORS_BASE_URL,
      timeout: 15000,
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
      },
    });

    console.log('[OpenRouteService] Initialized with API key:', ORS_API_KEY.substring(0, 10) + '...');
  }

  /**
   * Get driving route between two points
   * @param start [longitude, latitude] or {latitude, longitude}
   * @param end [longitude, latitude] or {latitude, longitude}
   * @returns RouteResult with coordinates, distance, duration, and turn-by-turn steps
   */
  async getRoute(
    start: [number, number] | RouteCoordinate,
    end: [number, number] | RouteCoordinate
  ): Promise<RouteResult> {
    try {
      // Normalize inputs to [longitude, latitude] format for ORS
      const startCoord = Array.isArray(start)
        ? start
        : [start.longitude, start.latitude];

      const endCoord = Array.isArray(end)
        ? end
        : [end.longitude, end.latitude];

      console.log('[OpenRouteService] Fetching route:', {
        start: startCoord,
        end: endCoord,
      });

      const response = await this.api.post('/directions/driving-car/geojson', {
        coordinates: [startCoord, endCoord],
        instructions: true,
        preference: 'fastest',
        units: 'm',
      });

      if (!response.data.features || response.data.features.length === 0) {
        throw new Error('No route found');
      }

      const feature = response.data.features[0];
      const coords = feature.geometry.coordinates; // [lon, lat] pairs
      const segment = feature.properties.segments[0];

      // Convert [lon, lat] to {latitude, longitude} for react-native-maps
      const coordinates: RouteCoordinate[] = coords.map((c: number[]) => ({
        latitude: c[1],
        longitude: c[0],
      }));

      // Extract turn-by-turn steps
      const steps: RouteStep[] = segment.steps.map((step: any) => ({
        instruction: step.instruction,
        distance: step.distance,
        duration: step.duration,
        type: step.type,
        name: step.name || '',
        wayPoints: step.way_points || [],
      }));

      const result: RouteResult = {
        coordinates,
        distance: segment.distance,
        duration: segment.duration,
        steps,
        summary: {
          distance: segment.distance,
          duration: segment.duration,
        },
      };

      console.log('[OpenRouteService] Route fetched successfully:', {
        distance: this.formatDistance(result.distance),
        duration: this.formatDuration(result.duration),
        points: coordinates.length,
        steps: steps.length,
      });

      return result;
    } catch (error: any) {
      console.error('[OpenRouteService] Route error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.status === 401) {
        throw new Error('Invalid OpenRouteService API key');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.data?.error) {
        throw new Error(`Route error: ${error.response.data.error.message}`);
      }

      throw new Error('Failed to get route. Please check your connection.');
    }
  }

  /**
   * Get distance matrix between multiple points
   * @param sources Array of source coordinates [longitude, latitude]
   * @param destinations Array of destination coordinates [longitude, latitude]
   * @returns Distance and duration matrices
   */
  async getDistanceMatrix(
    sources: [number, number][] | RouteCoordinate[],
    destinations: [number, number][] | RouteCoordinate[]
  ): Promise<DistanceMatrixResult> {
    try {
      // Normalize to [lon, lat] format
      const normalizedSources = sources.map(s =>
        Array.isArray(s) ? s : [s.longitude, s.latitude]
      );
      const normalizedDestinations = destinations.map(d =>
        Array.isArray(d) ? d : [d.longitude, d.latitude]
      );

      const allLocations = [...normalizedSources, ...normalizedDestinations];
      const sourceIndices = normalizedSources.map((_, i) => i);
      const destinationIndices = normalizedDestinations.map((_, i) => normalizedSources.length + i);

      const response = await this.api.post('/matrix/driving-car', {
        locations: allLocations,
        sources: sourceIndices,
        destinations: destinationIndices,
        metrics: ['distance', 'duration'],
      });

      return {
        distances: response.data.distances,
        durations: response.data.durations,
      };
    } catch (error: any) {
      console.error('[OpenRouteService] Distance matrix error:', error.response?.data || error.message);
      throw new Error('Failed to calculate distance matrix');
    }
  }

  /**
   * Geocode an address to coordinates
   * @param address Address string to geocode
   * @returns Coordinates and address details, or null if not found
   */
  async geocode(address: string): Promise<GeocodingResult | null> {
    try {
      const response = await this.api.get('/geocode/search', {
        params: {
          text: address,
          size: 1, // Only get top result
        },
      });

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const coords = feature.geometry.coordinates;

        return {
          latitude: coords[1],
          longitude: coords[0],
          address: feature.properties.label,
          confidence: feature.properties.confidence || 0,
        };
      }

      return null;
    } catch (error: any) {
      console.error('[OpenRouteService] Geocode error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to an address
   * @param latitude Latitude
   * @param longitude Longitude
   * @returns Address string, or null if not found
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const response = await this.api.get('/geocode/reverse', {
        params: {
          'point.lon': longitude,
          'point.lat': latitude,
          size: 1,
        },
      });

      if (response.data.features && response.data.features.length > 0) {
        return response.data.features[0].properties.label;
      }

      return null;
    } catch (error: any) {
      console.error('[OpenRouteService] Reverse geocode error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Format distance to human-readable string
   * @param meters Distance in meters
   * @returns Formatted string (e.g., "150 m" or "2.5 km")
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration to human-readable string
   * @param seconds Duration in seconds
   * @returns Formatted string (e.g., "5 min" or "1h 30m")
   */
  formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  }

  /**
   * Check if OpenRouteService is configured
   */
  isConfigured(): boolean {
    return ORS_API_KEY.length > 0 && ORS_API_KEY !== 'YOUR_ORS_API_KEY_HERE';
  }

  /**
   * Get API key (for debugging)
   */
  getApiKey(): string {
    return ORS_API_KEY.substring(0, 10) + '...';
  }
}

// Export singleton instance
export default new OpenRouteService();

/**
 * Google Maps Directions API Service
 *
 * Provides routing functionality for responder navigation
 */

import { GOOGLE_MAPS_API_KEY } from '@/src/config/env';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteResponse {
  coordinates: RouteCoordinate[];
  distance: {
    meters: number;
    text: string;
  };
  duration: {
    seconds: number;
    text: string;
  };
  encoded_polyline?: string;
}

/**
 * Get driving route from origin to destination using Google Directions API
 */
export const getRoute = async (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<RouteResponse> => {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${origin.latitude},${origin.longitude}&` +
      `destination=${destination.latitude},${destination.longitude}&` +
      `mode=driving&` +
      `key=${GOOGLE_MAPS_API_KEY}`;

    console.log('[Maps Service] Fetching route from Google Directions API');

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];

      // Decode polyline to coordinates
      const coordinates = decodePolyline(route.overview_polyline.points);

      console.log('[Maps Service] Route received:', {
        distance: leg.distance.text,
        duration: leg.duration.text,
        steps: leg.steps.length,
      });

      return {
        coordinates,
        distance: {
          meters: leg.distance.value,
          text: leg.distance.text,
        },
        duration: {
          seconds: leg.duration.value,
          text: leg.duration.text,
        },
        encoded_polyline: route.overview_polyline.points,
      };
    }

    throw new Error(`Directions API error: ${data.status}`);
  } catch (error: any) {
    console.error('[Maps Service] Get route error:', error);
    throw error;
  }
};

/**
 * Decode Google Maps polyline to array of coordinates
 * Uses standard Google polyline decoding algorithm
 */
function decodePolyline(encoded: string): RouteCoordinate[] {
  const coordinates: RouteCoordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    // Decode latitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return coordinates;
}

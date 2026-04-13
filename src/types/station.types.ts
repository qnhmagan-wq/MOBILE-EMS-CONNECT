/**
 * Emergency Station Type Definitions
 *
 * Types for the nearby emergency stations feature
 * including fire stations and police stations.
 */

/**
 * Station category values matching backend API
 */
export type StationCategory = 'fire_station' | 'police_station';

/**
 * Emergency station from GET /api/stations/nearby
 */
export interface Station {
  id: number;
  name: string;
  category: StationCategory;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  phone_number: string;
  notes: string | null;
  distance: number;
}

/**
 * Response from GET /api/stations/nearby
 */
export interface NearbyStationsResponse {
  stations: Station[];
}

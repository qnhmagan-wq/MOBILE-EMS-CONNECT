/**
 * Tracking System Type Definitions
 *
 * Types for real-time responder tracking including
 * responder locations, routes, ETA calculations, and tracking responses.
 */

/**
 * Responder's current GPS location
 */
export interface ResponderLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

/**
 * Single coordinate point in a route
 */
export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Responder tracking information with location, ETA, and route
 */
export interface ResponderTracking {
  id: number;
  name: string;
  phone_number: string;
  dispatch_id: number;
  status: 'assigned' | 'accepted' | 'en_route' | 'arrived' | 'completed' | 'declined';
  current_location: ResponderLocation | null;
  distance: {
    meters: number;
    text: string;
  } | null;
  eta: {
    seconds: number;
    text: string;
  } | null;
  route: {
    coordinates: RouteCoordinate[];
    encoded_polyline?: string;
  } | null;
  timeline: {
    assigned_at: string;
    accepted_at: string | null;
    en_route_at: string | null;
    arrived_at: string | null;
    completed_at: string | null;
  };
}

/**
 * Incident information in tracking response
 */
export interface TrackingIncident {
  id: number;
  type: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  created_at: string;
}

/**
 * Complete tracking response from API
 * GET /api/incidents/:id/tracking
 */
export interface TrackingResponse {
  incident: TrackingIncident;
  responders: ResponderTracking[];
  tracking_available: boolean;
  message: string;
}

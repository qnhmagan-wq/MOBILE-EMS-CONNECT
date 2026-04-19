/**
 * Dispatch System Type Definitions
 *
 * Types for the live dispatch system including duty status,
 * dispatch management, and location tracking.
 */

import { Incident } from './incident.types';

/**
 * Responder duty status
 */
export type DutyStatus = 'on_duty' | 'off_duty';

/**
 * Responder status for backend compatibility
 */
export type ResponderStatus = 'idle' | 'busy' | 'offline';

/**
 * Dispatch status lifecycle
 * assigned -> accepted/declined -> en_route -> arrived -> transporting_to_hospital -> completed
 * Any active status can also transition to cancelled.
 */
export type DispatchStatus =
  | 'assigned'                    // Admin assigned responder to incident
  | 'accepted'                    // Responder accepted the dispatch
  | 'declined'                    // Responder declined the dispatch
  | 'en_route'                    // Responder is on the way
  | 'arrived'                     // Responder arrived at scene
  | 'transporting_to_hospital'    // Responder is transporting patient to hospital
  | 'completed'                   // Incident resolved
  | 'cancelled';                  // Dispatch cancelled

/**
 * Dispatch assignment with incident details
 */
export interface Dispatch {
  id: number;
  incident_id: number;
  responder_id: number;
  status: DispatchStatus;
  distance_meters?: number;
  distance_text?: string;
  estimated_duration_seconds?: number;
  duration_text?: string;
  assigned_at: string;
  accepted_at?: string | null;
  declined_at?: string | null;
  en_route_at?: string | null;
  arrived_at?: string | null;
  transporting_to_hospital_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;

  // Nested incident details
  incident: {
    id: number;
    type: string;
    status: string;
    latitude: number;
    longitude: number;
    address: string;
    description: string;
    created_at: string;
    reporter?: {
      name: string;
      phone_number: string;
    };
  };

  // Hospital route information (available when status is arrived or transporting_to_hospital)
  hospital_route?: HospitalRouteData | null;
}

/**
 * Location update for GPS tracking
 */
export interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp?: number;
  accuracy?: number;
}

/**
 * Duty status update request
 */
export interface DutyStatusRequest {
  is_on_duty: boolean;
  responder_status: ResponderStatus;
}

/**
 * Duty status update response
 */
export interface DutyStatusResponse {
  message: string;
  status: {
    is_on_duty: boolean;
    responder_status: ResponderStatus;
    duty_started_at?: string | null;
    duty_ended_at?: string | null;
    last_active_at?: string | null;
  };
}

/**
 * Location update request. `accuracy` is the OS-reported horizontal accuracy in
 * meters; omit the field when the OS doesn't provide one (do NOT send 0/null —
 * the backend treats missing-vs-present differently for auto-arrival logic).
 */
export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Auto-arrival data returned when responder is within 100m of incident
 */
export interface AutoArrivedData {
  dispatch_id: number;
  incident_id: number;
  status: 'arrived';
  arrived_at: string;
}

/**
 * Active-dispatch snapshot returned on every successful location ping.
 * Source of truth for the live distance bar.
 */
export interface ActiveDispatchSnapshot {
  id: number;
  incident_id: number;
  status: DispatchStatus;
  distance_meters: number;
  distance_text: string;
  estimated_duration_seconds: number;
  duration_text: string;
  calculated_at: string;
}

/**
 * Location update response
 */
export interface LocationUpdateResponse {
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    updated_at: string;
    last_active_at?: string;
  };
  active_dispatch?: ActiveDispatchSnapshot | null;
  auto_arrived?: AutoArrivedData;
}

/**
 * Nearby incident (pending, within 1km)
 */
export interface NearbyIncident {
  incident_id: number;
  type: string;
  status: string;
  distance_meters: number;
  distance_text: string;
  estimated_duration_seconds: number;
  duration_text: string;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  created_at: string;
  can_accept: boolean;
  reporter?: {
    name: string;
    phone_number: string;
  };
  route?: {
    coordinates: Array<{ latitude: number; longitude: number }>;
    distance_text: string;
    duration_text: string;
    method: string;
  };
}

/**
 * Get dispatches response
 */
export interface GetDispatchesResponse {
  dispatches: Dispatch[];
  nearby_incidents?: NearbyIncident[];
  _rawKeys?: string;
}

/**
 * Update dispatch status request
 */
export interface UpdateDispatchStatusRequest {
  status: DispatchStatus;
}

/**
 * Update dispatch status response
 */
export interface UpdateDispatchStatusResponse {
  message: string;
  dispatch: Dispatch;
}

/**
 * Dispatch notification data
 */
export interface DispatchNotificationData {
  dispatchId: number;
  incidentId: number;
  incidentType: string;
  address: string;
}

/**
 * Pre-arrival information submission request
 */
export interface PreArrivalRequest {
  patient_name: string;
  sex: 'Male' | 'Female' | 'Other';
  age: number;
  incident_type: string;
  caller_name?: string;
  estimated_arrival?: string; // ISO8601 format
}

/**
 * Pre-arrival information submission response
 */
export interface PreArrivalResponse {
  message: string;
  pre_arrival?: PreArrivalData;
}

/**
 * Pre-arrival data structure (for form state and API responses)
 */
export interface PreArrivalData {
  id: number;
  dispatch_id: number;
  patient_name: string;
  sex: 'Male' | 'Female' | 'Other';
  age: number;
  incident_type: string;
  caller_name?: string | null;
  estimated_arrival?: string | null;
  submitted_at: string;
}

/**
 * Form data structure for UI state management (multi-patient)
 */
export interface PatientFormData {
  patient_name: string;
  sex: 'Male' | 'Female' | 'Other' | '';
  age: string; // Keep as string for form input
  incident_type: string;
  caller_name?: string;
  estimated_arrival?: string | null;
}

/**
 * Multi-patient pre-arrival request format
 */
export interface MultiPatientPreArrivalRequest {
  patients: Array<{
    patient_name: string;
    sex: 'Male' | 'Female' | 'Other';
    age: number;
    incident_type: string;
    caller_name?: string;
    estimated_arrival?: string;
  }>;
}

/**
 * Multi-patient pre-arrival response format
 */
export interface MultiPatientPreArrivalResponse {
  message: string;
  patient_count: number;
  patients: PreArrivalData[];
}

/**
 * Hospital type classification
 */
export type HospitalType = 'government' | 'private' | 'health_center';

/**
 * Hospital information
 */
export interface Hospital {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone_number: string;
  type?: HospitalType;
  has_emergency_room?: boolean;
}

/**
 * Route coordinate point
 */
export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Route calculation method
 */
export type RouteMethod = 'google_maps' | 'openrouteservice' | 'haversine';

/**
 * Route information from current location to hospital
 */
export interface RouteInfo {
  distance_meters: number;
  duration_seconds: number;
  distance_text: string;
  duration_text: string;
  coordinates: RouteCoordinate[];
  encoded_polyline?: string;
  method: RouteMethod;
}

/**
 * Hospital route data (hospital info + route)
 */
export interface HospitalRouteData {
  hospital: Hospital;
  route: RouteInfo;
}

/**
 * Get hospital route response
 */
export interface GetHospitalRouteResponse {
  hospital: Hospital;
  route: RouteInfo;
}

/**
 * Assign hospital request
 */
export interface AssignHospitalRequest {
  hospital_id: number;
}

/**
 * Assign hospital response
 * Note: Returns dispatch with hospital info, not full route data.
 * Call getHospitalRoute() separately to get the route after assignment.
 */
export interface AssignHospitalResponse {
  message: string;
  dispatch: {
    id: number;
    status: string;
    hospital_id: number;
    hospital: Hospital;
  };
}

/**
 * Nearby hospital (hospital with optional distance info)
 * Note: distance fields may not be returned by backend — calculate client-side if missing
 */
export interface NearbyHospital extends Hospital {
  distance_meters?: number;
  distance_text?: string;
}

/**
 * Nearby hospitals response
 */
export interface NearbyHospitalsResponse {
  hospitals: NearbyHospital[];
}

/**
 * Incident validity assessment by responder
 */
export type IncidentValidity = 'legitimate' | 'false_alarm' | 'exaggerated' | 'uncertain';

/**
 * Severity assessment by responder
 */
export type SeverityAssessment = 'critical' | 'serious' | 'moderate' | 'minor' | 'non_emergency';

/**
 * Incident report request (on-scene assessment)
 */
export interface IncidentReportRequest {
  incident_validity: IncidentValidity;
  severity_assessment?: SeverityAssessment | null;
  scene_description?: string | null;
  remarks?: string | null;
  additional_resources_needed?: boolean;
  additional_resources_details?: string | null;
}

/**
 * Incident report data (from API response)
 */
export interface IncidentReport {
  id: number;
  dispatch_id: number;
  incident_id: number;
  incident_validity: IncidentValidity;
  severity_assessment: SeverityAssessment | null;
  scene_description: string | null;
  remarks: string | null;
  additional_resources_needed: boolean;
  additional_resources_details: string | null;
  submitted_at: string;
}

/**
 * Incident report response
 */
export interface IncidentReportResponse {
  message: string;
  report: IncidentReport;
}

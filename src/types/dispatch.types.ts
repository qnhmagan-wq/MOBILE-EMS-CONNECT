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
 * assigned -> accepted/declined -> en_route -> arrived -> completed
 */
export type DispatchStatus =
  | 'assigned'    // Admin assigned responder to incident
  | 'accepted'    // Responder accepted the dispatch
  | 'declined'    // Responder declined the dispatch
  | 'en_route'    // Responder is on the way
  | 'arrived'     // Responder arrived at scene
  | 'completed';  // Incident resolved

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
  completed_at?: string | null;
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
}

/**
 * Location update for GPS tracking
 */
export interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp?: number;
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
  };
}

/**
 * Location update request
 */
export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
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
  };
}

/**
 * Get dispatches response
 */
export interface GetDispatchesResponse {
  dispatches: Dispatch[];
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
  pre_arrival?: {
    id: number;
    dispatch_id: number;
    patient_name: string;
    sex: string;
    age: number;
    incident_type: string;
    caller_name?: string;
    estimated_arrival?: string;
    created_at: string;
  };
}

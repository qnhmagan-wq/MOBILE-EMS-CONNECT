// Incident Types for EMS Connect Mobile App

export type IncidentType = 
  | 'medical' 
  | 'fire' 
  | 'accident' 
  | 'crime' 
  | 'natural_disaster' 
  | 'other';

export type IncidentStatus = 
  | 'pending'      // Just reported, waiting for dispatch
  | 'dispatched'   // Responders assigned
  | 'in_progress'  // Responders on scene
  | 'completed'    // Emergency resolved
  | 'cancelled';   // User cancelled

/**
 * Post-incident feedback from community user
 */
export interface IncidentFeedback {
  id: number;
  incident_id: number;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
}

export interface Incident {
  id: number;
  type: IncidentType;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  created_at: string;
  updated_at?: string;
  dispatched_at?: string | null;
  completed_at?: string | null;
  feedback?: IncidentFeedback | null;
  can_submit_feedback?: boolean;
}

export interface CreateIncidentRequest {
  type: IncidentType;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
}

export interface CreateIncidentResponse {
  message: string;
  incident: Incident;
}

export interface GetIncidentsResponse {
  incidents: Incident[];
}

export interface GetIncidentResponse {
  incident: Incident;
}

export interface SubmitFeedbackRequest {
  rating: number;
  comment?: string | null;
}

export interface SubmitFeedbackResponse {
  message: string;
  feedback: IncidentFeedback;
}

export interface GetFeedbackStatusResponse {
  feedback: IncidentFeedback | null;
  can_submit: boolean;
}




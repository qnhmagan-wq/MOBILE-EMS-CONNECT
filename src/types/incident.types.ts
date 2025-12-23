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




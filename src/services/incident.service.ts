import api from './api';
import {
  CreateIncidentRequest,
  CreateIncidentResponse,
  GetIncidentsResponse,
  GetIncidentResponse,
  Incident,
} from '@/src/types/incident.types';

/**
 * Create a new emergency incident
 * POST /api/incidents
 */
export const createIncident = async (
  request: CreateIncidentRequest
): Promise<CreateIncidentResponse> => {
  try {
    const response = await api.post<CreateIncidentResponse>('/incidents', request);
    return response.data;
  } catch (error: any) {
    console.error('[Incident Service] Create incident error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get all incidents for the current user
 * GET /api/incidents/my
 */
export const getIncidents = async (): Promise<Incident[]> => {
  try {
    const response = await api.get<GetIncidentsResponse>('/incidents/my');
    return response.data.incidents;
  } catch (error: any) {
    console.error('[Incident Service] Get incidents error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get a specific incident by ID
 * GET /api/incidents/:id
 */
export const getIncident = async (id: number): Promise<Incident> => {
  try {
    const response = await api.get<GetIncidentResponse>(`/incidents/${id}`);
    return response.data.incident;
  } catch (error: any) {
    console.error('[Incident Service] Get incident error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Cancel an incident
 * POST /api/incidents/:id/cancel
 */
export const cancelIncident = async (id: number): Promise<{ message: string; incident: Incident }> => {
  try {
    const response = await api.post<{ message: string; incident: Incident }>(`/incidents/${id}/cancel`);
    return response.data;
  } catch (error: any) {
    console.error('[Incident Service] Cancel incident error:', error.response?.data || error.message);
    throw error;
  }
};




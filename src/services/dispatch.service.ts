/**
 * Dispatch Service
 *
 * API service for responder dispatch management including:
 * - Location updates
 * - Duty status management
 * - Dispatch assignments
 * - Dispatch status updates
 */

import api from './api';
import {
  DutyStatusRequest,
  DutyStatusResponse,
  LocationUpdateRequest,
  LocationUpdateResponse,
  GetDispatchesResponse,
  UpdateDispatchStatusRequest,
  UpdateDispatchStatusResponse,
  Dispatch,
  PreArrivalRequest,
  PreArrivalResponse,
  MultiPatientPreArrivalRequest,
  MultiPatientPreArrivalResponse,
  GetHospitalRouteResponse,
  AssignHospitalResponse,
  NearbyHospitalsResponse,
  IncidentReportRequest,
  IncidentReportResponse,
} from '@/src/types/dispatch.types';

/**
 * Update responder's current location
 * POST /api/responder/location
 */
export const updateLocation = async (
  location: LocationUpdateRequest
): Promise<LocationUpdateResponse> => {
  try {
    const response = await api.post<LocationUpdateResponse>('/responder/location', location);
    return response.data;
  } catch (error: any) {
    console.error('[Dispatch Service] Update location error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Update responder's duty status (on/off duty)
 * POST /api/responder/status
 */
export const updateDutyStatus = async (
  request: DutyStatusRequest
): Promise<DutyStatusResponse> => {
  try {
    console.log('[Dispatch Service] Updating duty status:', {
      endpoint: '/responder/status',
      payload: request,
      timestamp: new Date().toISOString()
    });

    const response = await api.post<DutyStatusResponse>('/responder/status', request);

    console.log('[Dispatch Service] Duty status updated successfully:', response.data);
    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data;
    const statusCode = error.response?.status;

    // Comprehensive error logging
    console.error('[Dispatch Service] Update duty status error:', {
      status: statusCode,
      statusText: error.response?.statusText,
      data: errorData,
      message: error.message,
      endpoint: '/responder/status',
      payload: request,
      timestamp: new Date().toISOString()
    });

    // Provide helpful error messages based on status code
    if (statusCode === 500) {
      console.warn('[Dispatch Service] Backend returned 500 for duty status (will retry on next app start)');
      // Don't throw - let the caller handle this gracefully
      throw new Error('BACKEND_500'); // Special error code for graceful handling
    } else if (statusCode === 404) {
      throw new Error('Duty status endpoint not found. The backend API route /responder/status may not exist.');
    } else if (statusCode === 422) {
      throw new Error(`Invalid payload format: ${errorData?.message || 'Backend expects different data format'}`);
    } else if (statusCode === 401 || statusCode === 403) {
      throw new Error('Authentication error: Please log in again.');
    } else {
      throw new Error(errorData?.message || `Failed to update duty status (Status: ${statusCode})`);
    }
  }
};

/**
 * Get all dispatches assigned to the current responder
 * GET /api/responder/dispatches
 * Returns assigned dispatches and nearby pending incidents
 *
 * Normalizes response across multiple possible backend formats:
 * - { dispatches: [...], nearby_incidents: [...] }
 * - { data: { dispatches: [...], nearby_incidents: [...] } }
 * - { data: [...] } (bare array in data key)
 * - [...] (bare array response)
 */
export const getDispatches = async (): Promise<GetDispatchesResponse> => {
  try {
    const response = await api.get('/responder/dispatches');
    const rawData = response.data;

    console.log('[Dispatch Service] RAW response keys:', rawData ? Object.keys(rawData) : 'null');
    console.log('[Dispatch Service] RAW response type:', typeof rawData, Array.isArray(rawData) ? '(array)' : '');
    console.log('[Dispatch Service] RAW response:', JSON.stringify(rawData));

    // Normalize dispatches from multiple possible response shapes
    let dispatches: Dispatch[] = [];
    let nearbyIncidents: any[] = [];

    if (Array.isArray(rawData)) {
      // Backend returned a bare array
      dispatches = rawData.filter((item: any) => item.incident_id !== undefined);
      console.log('[Dispatch Service] Parsed as bare array');
    } else if (rawData && typeof rawData === 'object') {
      // Try: rawData.assigned_dispatches (actual backend key)
      if (Array.isArray(rawData.assigned_dispatches)) {
        dispatches = rawData.assigned_dispatches;
        console.log('[Dispatch Service] Parsed from rawData.assigned_dispatches');
      }
      // Try: rawData.dispatches (fallback)
      else if (Array.isArray(rawData.dispatches)) {
        dispatches = rawData.dispatches;
        console.log('[Dispatch Service] Parsed from rawData.dispatches');
      }
      // Try: rawData.data.assigned_dispatches (Laravel nested wrapper)
      else if (rawData.data && Array.isArray(rawData.data.assigned_dispatches)) {
        dispatches = rawData.data.assigned_dispatches;
        console.log('[Dispatch Service] Parsed from rawData.data.assigned_dispatches');
      }
      // Try: rawData.data.dispatches (Laravel nested wrapper)
      else if (rawData.data && Array.isArray(rawData.data.dispatches)) {
        dispatches = rawData.data.dispatches;
        console.log('[Dispatch Service] Parsed from rawData.data.dispatches');
      }
      // Try: rawData.data as array (Laravel data key with bare array)
      else if (Array.isArray(rawData.data)) {
        dispatches = rawData.data.filter((item: any) => item.incident_id !== undefined);
        console.log('[Dispatch Service] Parsed from rawData.data (array)');
      }

      // Normalize nearby_incidents
      if (Array.isArray(rawData.nearby_incidents)) {
        nearbyIncidents = rawData.nearby_incidents;
      } else if (rawData.data && Array.isArray(rawData.data.nearby_incidents)) {
        nearbyIncidents = rawData.data.nearby_incidents;
      }
    }

    console.log('[Dispatch Service] Fetched dispatches:', {
      assignedCount: dispatches.length,
      nearbyCount: nearbyIncidents.length,
      dispatchIds: dispatches.map((d: any) => d.id),
    });

    // Include raw keys for mobile diagnostics (not visible in console on device)
    let rawKeys = 'null';
    if (Array.isArray(rawData)) {
      rawKeys = '(array)';
    } else if (rawData && typeof rawData === 'object') {
      rawKeys = Object.keys(rawData).join(',');
    }

    return { dispatches, nearby_incidents: nearbyIncidents, _rawKeys: rawKeys };
  } catch (error: any) {
    console.error('[Dispatch Service] Get dispatches error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

/**
 * Update dispatch status (accept, decline, en_route, arrived, completed)
 * POST /api/responder/dispatches/:id/status
 */
export const updateDispatchStatus = async (
  dispatchId: number,
  request: UpdateDispatchStatusRequest
): Promise<UpdateDispatchStatusResponse> => {
  try {
    const response = await api.post<UpdateDispatchStatusResponse>(
      `/responder/dispatches/${dispatchId}/status`,
      request
    );
    return response.data;
  } catch (error: any) {
    console.error('[Dispatch Service] Update dispatch status error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Submit pre-arrival patient information (single patient - legacy)
 * POST /api/responder/dispatches/:dispatchId/pre-arrival
 */
export const submitPreArrival = async (
  dispatchId: number,
  request: PreArrivalRequest
): Promise<PreArrivalResponse> => {
  try {
    console.log('[Dispatch Service] Submitting pre-arrival info:', {
      dispatchId,
      payload: request,
      timestamp: new Date().toISOString()
    });

    const response = await api.post<PreArrivalResponse>(
      `/responder/dispatches/${dispatchId}/pre-arrival`,
      request
    );

    console.log('[Dispatch Service] Pre-arrival submitted successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Dispatch Service] Submit pre-arrival error:', {
      status: error.response?.status,
      data: error.response?.data || error.message,
      dispatchId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

/**
 * Submit multi-patient pre-arrival information
 * POST /api/responder/dispatches/:dispatchId/pre-arrival
 */
export const submitMultiPatientPreArrival = async (
  dispatchId: number,
  patients: MultiPatientPreArrivalRequest['patients']
): Promise<MultiPatientPreArrivalResponse> => {
  try {
    console.log('[Dispatch Service] Submitting multi-patient pre-arrival:', {
      dispatchId,
      patientCount: patients.length,
      timestamp: new Date().toISOString()
    });

    const response = await api.post<MultiPatientPreArrivalResponse>(
      `/responder/dispatches/${dispatchId}/pre-arrival`,
      { patients }
    );

    console.log('[Dispatch Service] Multi-patient pre-arrival submitted:', {
      patientCount: response.data.patient_count,
      message: response.data.message,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Dispatch Service] Submit multi-patient error:', {
      status: error.response?.status,
      data: error.response?.data || error.message,
      dispatchId,
      patientCount: patients.length,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

/**
 * Accept a nearby incident (self-dispatch)
 * POST /api/responder/incidents/:id/accept
 */
export const acceptNearbyIncident = async (
  incidentId: number
): Promise<UpdateDispatchStatusResponse> => {
  try {
    console.log('[Dispatch Service] Accepting nearby incident:', {
      incidentId,
      timestamp: new Date().toISOString(),
    });

    const response = await api.post<UpdateDispatchStatusResponse>(
      `/responder/incidents/${incidentId}/accept`
    );

    console.log('[Dispatch Service] Nearby incident accepted:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Dispatch Service] Accept nearby incident error:', {
      status: error.response?.status,
      data: error.response?.data || error.message,
      incidentId,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Get hospital route for dispatch
 * GET /api/responder/dispatches/:dispatchId/hospital-route
 */
/**
 * Assign a hospital to a dispatch
 * POST /api/responder/dispatches/:dispatchId/assign-hospital
 */
export const assignHospital = async (
  dispatchId: number,
  hospitalId: number
): Promise<AssignHospitalResponse> => {
  try {
    console.log('[Dispatch Service] Assigning hospital:', {
      dispatchId,
      hospitalId,
      timestamp: new Date().toISOString()
    });

    const response = await api.post<AssignHospitalResponse>(
      `/responder/dispatches/${dispatchId}/assign-hospital`,
      { hospital_id: hospitalId }
    );

    console.log('[Dispatch Service] Hospital assigned successfully:', {
      hospitalName: response.data.dispatch?.hospital?.name,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Dispatch Service] Assign hospital error:', {
      status: error.response?.status,
      data: error.response?.data || error.message,
      dispatchId,
      hospitalId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

/**
 * Get nearby hospitals
 * GET /api/hospitals/nearby?latitude=X&longitude=Y&radius=Z
 */
export const getNearbyHospitals = async (
  latitude: number,
  longitude: number,
  radius?: number
): Promise<NearbyHospitalsResponse> => {
  try {
    console.log('[Dispatch Service] Fetching nearby hospitals:', {
      latitude,
      longitude,
      radius,
      timestamp: new Date().toISOString()
    });

    const params: Record<string, any> = { latitude, longitude };
    if (radius) params.radius = radius;

    const response = await api.get<NearbyHospitalsResponse>(
      '/hospitals/nearby',
      { params }
    );

    console.log('[Dispatch Service] Nearby hospitals fetched:', {
      count: response.data.hospitals?.length || 0,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Dispatch Service] Get nearby hospitals error:', {
      status: error.response?.status,
      data: error.response?.data || error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

/**
 * Get hospital route for dispatch
 * GET /api/responder/dispatches/:dispatchId/hospital-route
 */
export const getHospitalRoute = async (
  dispatchId: number
): Promise<GetHospitalRouteResponse> => {
  try {
    console.log('[Dispatch Service] Fetching hospital route:', {
      dispatchId,
      timestamp: new Date().toISOString()
    });

    const response = await api.get<GetHospitalRouteResponse>(
      `/responder/dispatches/${dispatchId}/hospital-route`
    );

    console.log('[Dispatch Service] Hospital route fetched successfully:', {
      hospitalName: response.data.hospital.name,
      distance: response.data.route.distance_text,
      duration: response.data.route.duration_text,
    });

    return response.data;
  } catch (error: any) {
    console.error('[Dispatch Service] Get hospital route error:', {
      status: error.response?.status,
      data: error.response?.data || error.message,
      dispatchId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

/**
 * Submit or update incident report (on-scene assessment)
 * POST /api/responder/dispatches/:dispatchId/incident-report
 * Upsert: submitting again updates the existing report
 */
export const submitIncidentReport = async (
  dispatchId: number,
  request: IncidentReportRequest
): Promise<IncidentReportResponse> => {
  try {
    console.log('[Dispatch Service] Submitting incident report:', {
      dispatchId,
      validity: request.incident_validity,
      timestamp: new Date().toISOString(),
    });

    const response = await api.post<IncidentReportResponse>(
      `/responder/dispatches/${dispatchId}/incident-report`,
      request
    );

    console.log('[Dispatch Service] Incident report submitted:', response.data.message);
    return response.data;
  } catch (error: any) {
    console.error('[Dispatch Service] Submit incident report error:', {
      status: error.response?.status,
      data: error.response?.data || error.message,
      dispatchId,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

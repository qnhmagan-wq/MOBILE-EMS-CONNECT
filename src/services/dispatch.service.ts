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
      throw new Error('Server error: The duty status endpoint may not be implemented yet on the backend. Please check backend API implementation.');
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
 */
export const getDispatches = async (): Promise<Dispatch[]> => {
  try {
    const response = await api.get<GetDispatchesResponse>('/responder/dispatches');
    return response.data.dispatches;
  } catch (error: any) {
    console.error('[Dispatch Service] Get dispatches error:', error.response?.data || error.message);
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

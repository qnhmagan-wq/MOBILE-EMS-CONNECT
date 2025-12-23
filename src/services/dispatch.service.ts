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
    const response = await api.post<DutyStatusResponse>('/responder/status', request);
    return response.data;
  } catch (error: any) {
    console.error('[Dispatch Service] Update duty status error:', error.response?.data || error.message);
    throw error;
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

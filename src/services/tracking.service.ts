/**
 * Tracking Service
 *
 * Handles API communication for real-time responder tracking.
 * Fetches responder locations, routes, ETA, and tracking availability.
 */

import api from './api';
import { TrackingResponse } from '@/src/types/tracking.types';

/**
 * Get real-time tracking data for a specific incident
 * Fetches responder locations, routes, and ETA calculations
 *
 * @param incidentId - The incident ID to track
 * @returns Promise<TrackingResponse> - Tracking data including responders and availability
 * @throws Error if request fails
 *
 * Endpoint: GET /api/incidents/:id/tracking
 * Auth: Requires Bearer token (auto-injected by api instance)
 */
export const getIncidentTracking = async (
  incidentId: number
): Promise<TrackingResponse> => {
  try {
    console.log('[Tracking Service] Fetching tracking for incident:', {
      incidentId,
      endpoint: `/incidents/${incidentId}/tracking`,
      timestamp: new Date().toISOString(),
    });

    const response = await api.get<TrackingResponse>(`/incidents/${incidentId}/tracking`);

    console.log('[Tracking Service] Tracking data retrieved:', {
      incidentId,
      respondersCount: response.data.responders.length,
      trackingAvailable: response.data.tracking_available,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Tracking Service] Get tracking error:', {
      incidentId,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data || error.message,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

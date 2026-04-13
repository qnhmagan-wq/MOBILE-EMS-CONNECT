/**
 * Station Service
 *
 * API calls for fetching nearby emergency stations
 * (fire stations and police stations).
 */

import api from './api';
import { NearbyStationsResponse, StationCategory } from '@/src/types/station.types';

/**
 * Get nearby emergency stations
 * GET /api/stations/nearby?latitude=X&longitude=Y&radius=Z&category=C
 */
export const getNearbyStations = async (
  latitude: number,
  longitude: number,
  radius?: number,
  category?: StationCategory
): Promise<NearbyStationsResponse> => {
  try {
    console.log('[Station Service] Fetching nearby stations:', {
      latitude, longitude, radius, category,
      timestamp: new Date().toISOString(),
    });

    const params: Record<string, any> = { latitude, longitude };
    if (radius) params.radius = radius;
    if (category) params.category = category;

    const response = await api.get<NearbyStationsResponse>(
      '/stations/nearby',
      { params }
    );

    console.log('[Station Service] Nearby stations fetched:', {
      count: response.data.stations?.length || 0,
      timestamp: new Date().toISOString(),
    });

    return response.data;
  } catch (error: any) {
    console.error('[Station Service] Get nearby stations error:', {
      status: error.response?.status,
      data: error.response?.data || error.message,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

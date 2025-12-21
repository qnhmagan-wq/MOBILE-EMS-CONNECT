import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import {
  Incident,
  IncidentType,
  CreateIncidentRequest,
} from '@/src/types/incident.types';
import * as incidentService from '@/src/services/incident.service';

interface UseIncidentsReturn {
  incidents: Incident[];
  currentIncident: Incident | null;
  isLoading: boolean;
  error: string | null;
  createIncident: (type: IncidentType, description: string) => Promise<Incident | null>;
  loadIncidents: () => Promise<void>;
  clearError: () => void;
}

export const useIncidents = (): UseIncidentsReturn => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get current location and reverse geocode to get address
   */
  const getCurrentLocation = async (): Promise<{
    latitude: number;
    longitude: number;
    address: string;
  }> => {
    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied. Please enable location access.');
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = location.coords;

    // Reverse geocode to get address
    let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    try {
      const [geocodeResult] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocodeResult) {
        const parts = [
          geocodeResult.streetNumber,
          geocodeResult.street,
          geocodeResult.district,
          geocodeResult.city,
          geocodeResult.region,
        ].filter(Boolean);
        address = parts.join(', ') || address;
      }
    } catch (geocodeError) {
      console.warn('Reverse geocoding failed, using coordinates:', geocodeError);
    }

    return { latitude, longitude, address };
  };

  /**
   * Create a new emergency incident
   */
  const createIncident = useCallback(async (
    type: IncidentType,
    description: string
  ): Promise<Incident | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get location
      console.log('[useIncidents] Step 1: Getting location...');
      let locationData;
      try {
        locationData = await getCurrentLocation();
        console.log('[useIncidents] Location obtained:', locationData);
      } catch (locationError: any) {
        console.error('[useIncidents] Location error:', locationError);
        if (locationError.message?.includes('permission')) {
          throw new Error('Location permission denied. Please enable location access in your phone settings.');
        } else if (locationError.message?.includes('timeout') || locationError.message?.includes('TIMEOUT')) {
          throw new Error('Location timeout. Please ensure GPS is enabled and try again.');
        } else {
          throw new Error(`Location error: ${locationError.message || 'Unable to get your location'}`);
        }
      }

      const { latitude, longitude, address } = locationData;

      // Step 2: Create incident request
      const request: CreateIncidentRequest = {
        type,
        latitude,
        longitude,
        address,
        description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} emergency`,
      };

      console.log('[useIncidents] Step 2: Creating incident via API:', request);

      // Step 3: Call API
      let response;
      try {
        response = await incidentService.createIncident(request);
        console.log('[useIncidents] Step 3: API response received:', response);
      } catch (apiError: any) {
        console.error('[useIncidents] API error details:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          message: apiError.message,
        });

        // Handle specific API errors
        if (apiError.response?.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (apiError.response?.status === 422) {
          const validationErrors = apiError.response?.data?.errors;
          if (validationErrors) {
            const firstError = Object.values(validationErrors)[0];
            const errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
            throw new Error(errorMsg || 'Validation error. Please check your input.');
          }
          throw new Error(apiError.response?.data?.message || 'Validation error');
        } else if (apiError.response?.status === 404) {
          throw new Error('API endpoint not found. Please contact support.');
        } else if (apiError.response?.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else if (apiError.code === 'NETWORK_ERROR' || apiError.message?.includes('Network')) {
          throw new Error('Network error. Please check your internet connection.');
        } else {
          throw new Error(apiError.response?.data?.message || apiError.message || 'Failed to create incident');
        }
      }
      
      if (!response || !response.incident) {
        console.error('[useIncidents] Invalid API response:', response);
        throw new Error('Invalid response from server. Please try again.');
      }

      console.log('[useIncidents] Incident created successfully:', response.incident);
      
      setCurrentIncident(response.incident);
      setIncidents(prev => [response.incident, ...prev]);

      return response.incident;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create incident';
      console.error('[useIncidents] Final error:', errorMessage, err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load all incidents for the user
   */
  const loadIncidents = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedIncidents = await incidentService.getIncidents();
      setIncidents(loadedIncidents);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load incidents';
      console.error('[useIncidents] Error loading incidents:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    incidents,
    currentIncident,
    isLoading,
    error,
    createIncident,
    loadIncidents,
    clearError,
  };
};




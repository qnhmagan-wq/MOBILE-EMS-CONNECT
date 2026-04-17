/**
 * DispatchContext
 *
 * Global state management for dispatch system including:
 * - Duty status management
 * - Location tracking
 * - Dispatch polling and management
 *
 * Pattern: Follows AuthContext.tsx pattern
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { DutyStatus, Dispatch, DispatchStatus, NearbyIncident, AutoArrivedData } from '@/src/types/dispatch.types';
import { useDispatchPolling } from '@/src/hooks/useDispatchPolling';
import * as dispatchService from '@/src/services/dispatch.service';
import * as locationService from '@/src/services/location.service';
import * as notificationService from '@/src/services/notification.service';
import * as journeyState from '@/src/services/journeyState.service';
import * as locationQueue from '@/src/services/locationQueue.service';
import { haversineMeters } from '@/src/utils/distance';
import { trackAction, ActionTypes } from '@/src/utils/actionTracking';
import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  requestBackgroundLocationPermissions,
  isBackgroundTrackingActive,
} from '@/src/services/backgroundLocation.service';
import { useAuth } from './AuthContext';

const LOCATION_INTERVAL_EN_ROUTE = 8000; // 8 seconds when en_route (frequent for auto-arrival detection)
const LOCATION_INTERVAL_DEFAULT = 30000; // 30 seconds otherwise (save battery)

// Auto status progression thresholds (client-side Responder Journey Tracker)
const EN_ROUTE_TRIGGER_METERS = 75;       // accepted -> en_route when this far from accept origin
const ARRIVING_BANNER_ON_METERS = 100;    // show "Arriving..." banner when this close to scene
const ARRIVING_BANNER_OFF_METERS = 150;   // hide banner past this (hysteresis, prevents flicker)
const CLIENT_ARRIVED_METERS = 25;         // client-side optimistic arrived trigger (tighter than backend 100m)

export interface DispatchContextType {
  // Location Tracking
  isTrackingActive: boolean;
  hasLocationPermission: boolean;
  // **FIX #4: Backend verification state**
  locationLastSent: Date | null;
  isBackendConfirmed: boolean;
  // Duty status verification — true only when backend confirms is_on_duty: true
  dutyStatusConfirmed: boolean;
  // Location failure counter for UI visibility
  locationFailureCount: number;

  // Dispatches
  dispatches: Dispatch[];
  activeDispatches: Dispatch[];
  nearbyIncidents: NearbyIncident[];
  lastPollTime: Date | null;
  lastPollResult: string | null;

  // Journey Tracker — live distance to scene per dispatch, and which one is "arriving"
  liveDistances: Record<number, number>;
  arrivingDispatchId: number | null;

  // Actions
  autoStartTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  updateDispatchStatus: (dispatchId: number, status: DispatchStatus) => Promise<any>;
  refreshDispatches: () => Promise<void>;
  retryDispatches: () => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const DispatchContext = createContext<DispatchContextType | undefined>(undefined);

export const DispatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // **FIX #4: Backend verification state**
  const [locationLastSent, setLocationLastSent] = useState<Date | null>(null);
  const [isBackendConfirmed, setIsBackendConfirmed] = useState(false);
  // Duty status verification — tracks whether backend confirmed on-duty
  const [dutyStatusConfirmed, setDutyStatusConfirmed] = useState(false);
  // Location failure counter for UI visibility
  const [locationFailureCount, setLocationFailureCount] = useState(0);

  // **FIX #2: Location interval ref for foreground updates**
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-arrival: prevent duplicate processing of the same dispatch
  const lastAutoArrivedDispatchRef = useRef<number | null>(null);

  // Track current location interval for dynamic frequency adjustments
  const currentIntervalRef = useRef<number>(LOCATION_INTERVAL_DEFAULT);

  // Journey Tracker state — per-dispatch distance to scene + which dispatch is "arriving"
  const [liveDistances, setLiveDistances] = useState<Record<number, number>>({});
  const [arrivingDispatchId, setArrivingDispatchId] = useState<number | null>(null);

  // In-memory mirror of the persisted active journey (hot path: read on every GPS fix)
  const activeJourneyRef = useRef<journeyState.JourneyEntry | null>(null);

  // Dedupe refs for auto-fired transitions
  const lastEnRouteTriggeredRef = useRef<number | null>(null);
  const lastArrivedTriggeredRef = useRef<number | null>(null);

  // Use dispatch polling hook
  const {
    dispatches,
    activeDispatches,
    nearbyIncidents,
    isPolling,
    lastPollTime,
    lastPollResult,
    startPolling,
    stopPolling,
    updateDispatchStatus: updateDispatchStatusHook,
    updateDispatchLocally,
    refreshDispatches,
    retryNow,
    error: pollingError,
    clearError: clearPollingError,
  } = useDispatchPolling();

  // Ref mirror of dispatches for use inside sendLocationUpdate (avoids stale closure)
  const dispatchesRef = useRef<Dispatch[]>([]);
  useEffect(() => {
    dispatchesRef.current = dispatches;
  }, [dispatches]);

  /**
   * Verify and log duty status response from backend.
   * Returns true if backend confirmed on-duty, false otherwise.
   */
  const verifyDutyStatusResponse = useCallback((response: any, context: string): boolean => {
    console.log(`🔍 [DispatchContext] Duty status verification (${context}):`);
    console.log(`   Full response: ${JSON.stringify(response)}`);

    // Check various response shapes the backend might use
    const isOnDuty =
      response?.status?.is_on_duty === true ||
      response?.is_on_duty === true ||
      response?.data?.is_on_duty === true ||
      response?.responder?.is_on_duty === true;

    const responderStatus =
      response?.status?.responder_status ||
      response?.responder_status ||
      response?.data?.responder_status ||
      response?.responder?.responder_status;

    console.log(`   Parsed is_on_duty: ${isOnDuty}`);
    console.log(`   Parsed responder_status: ${responderStatus}`);
    console.log(`   Response keys: ${response ? Object.keys(response).join(', ') : 'null'}`);

    if (!isOnDuty) {
      console.error(`❌ [DispatchContext] Backend did NOT confirm on-duty! (${context})`);
      console.error(`   This likely means the backend rejected or ignored the duty status update.`);
      console.error(`   The admin panel will show "0 responder(s) on duty" and dispatches won't appear.`);
    } else {
      console.log(`✅ [DispatchContext] Backend CONFIRMED on-duty (${context})`);
    }

    setDutyStatusConfirmed(isOnDuty);
    return isOnDuty;
  }, []);

  /**
   * Handle auto-arrival detected from a location update response.
   * Deduplicates by dispatch_id, updates local state, shows notification + alert,
   * and fetches full server data.
   */
  const handleAutoArrival = useCallback((autoArrived: AutoArrivedData) => {
    if (autoArrived.dispatch_id === lastAutoArrivedDispatchRef.current) {
      return; // Already processed this dispatch
    }

    const { dispatch_id, incident_id, arrived_at } = autoArrived;
    lastAutoArrivedDispatchRef.current = dispatch_id;

    console.log('[DispatchContext] Auto-arrival detected:', { dispatch_id, incident_id, arrived_at });

    // Update local dispatch state immediately (server already transitioned status)
    updateDispatchLocally(dispatch_id, {
      status: 'arrived',
      arrived_at: arrived_at,
    });

    // Dismiss arriving banner for this dispatch
    setArrivingDispatchId((prev) => (prev === dispatch_id ? null : prev));

    // Clear persisted journey if it matches — trip is over, no more geofence evals
    if (activeJourneyRef.current?.dispatchId === dispatch_id) {
      activeJourneyRef.current = null;
      journeyState.clearActiveJourney();
    }

    // Fetch complete server data so all fields are up to date
    refreshDispatches();

    // Show system notification (works even if user is in another app)
    const targetDispatch = dispatchesRef.current.find(d => d.id === dispatch_id);
    const address = targetDispatch?.incident?.address;
    notificationService.showAutoArrivalNotification(dispatch_id, address);

    // Show in-app alert
    Alert.alert(
      'Arrived at Incident',
      'You have been automatically marked as arrived at the incident location.',
      [{ text: 'OK' }]
    );
  }, [updateDispatchLocally, refreshDispatches]);

  /**
   * Journey tracker evaluation — runs on every successful GPS fix.
   * (a) Always updates liveDistances + arriving banner for UI.
   * (b) When `canFirePosts`, evaluates 75m accept-origin geofence for auto en_route
   *     and 25m scene geofence for client-side optimistic arrived.
   */
  const evaluateJourneyTransitions = useCallback(
    async (gps: { latitude: number; longitude: number }, canFirePosts: boolean) => {
      const journey = activeJourneyRef.current;
      if (!journey) return;

      const dispatch = dispatchesRef.current.find((d) => d.id === journey.dispatchId);
      if (!dispatch) return;

      const scene = dispatch.incident
        ? { latitude: dispatch.incident.latitude, longitude: dispatch.incident.longitude }
        : null;

      // --- UI: liveDistances + arriving banner (hysteresis) ---
      if (scene) {
        const distanceToScene = haversineMeters(gps, scene);
        setLiveDistances((prev) => ({ ...prev, [dispatch.id]: distanceToScene }));

        if (dispatch.status === 'en_route') {
          if (distanceToScene <= ARRIVING_BANNER_ON_METERS) {
            setArrivingDispatchId((prev) => (prev === dispatch.id ? prev : dispatch.id));
          } else if (distanceToScene > ARRIVING_BANNER_OFF_METERS) {
            setArrivingDispatchId((prev) => (prev === dispatch.id ? null : prev));
          }
        } else {
          // Not en_route — dismiss banner if we were showing it for this dispatch
          setArrivingDispatchId((prev) => (prev === dispatch.id ? null : prev));
        }
      }

      if (!canFirePosts) return;

      // --- accepted -> en_route @ >= 75m from accept origin ---
      if (dispatch.status === 'accepted' && lastEnRouteTriggeredRef.current !== dispatch.id) {
        const distFromOrigin = haversineMeters(gps, {
          latitude: journey.acceptOriginLat,
          longitude: journey.acceptOriginLon,
        });
        if (distFromOrigin >= EN_ROUTE_TRIGGER_METERS) {
          lastEnRouteTriggeredRef.current = dispatch.id;
          console.log(
            `[DispatchContext] Dispatch ${dispatch.id}: ${Math.round(distFromOrigin)}m from accept origin, auto-firing en_route`
          );
          const nowIso = new Date().toISOString();
          updateDispatchLocally(dispatch.id, { status: 'en_route', en_route_at: nowIso });
          try {
            await updateDispatchStatusHook(dispatch.id, 'en_route');
            await journeyState.updateActiveJourney({ enRouteTriggeredAt: nowIso });
            if (activeJourneyRef.current) {
              activeJourneyRef.current = { ...activeJourneyRef.current, enRouteTriggeredAt: nowIso };
            }
          } catch (err: any) {
            console.error(
              '[DispatchContext] Auto en_route POST failed:',
              err.response?.data || err.message
            );
            lastEnRouteTriggeredRef.current = null; // allow retry next tick
          }
        }
      }

      // --- en_route -> arrived @ <= 25m from scene (client-side optimistic) ---
      if (
        scene &&
        dispatch.status === 'en_route' &&
        lastArrivedTriggeredRef.current !== dispatch.id &&
        lastAutoArrivedDispatchRef.current !== dispatch.id
      ) {
        const distanceToScene = haversineMeters(gps, scene);
        if (distanceToScene <= CLIENT_ARRIVED_METERS) {
          lastArrivedTriggeredRef.current = dispatch.id;
          lastAutoArrivedDispatchRef.current = dispatch.id;
          console.log(
            `[DispatchContext] Dispatch ${dispatch.id}: ${Math.round(distanceToScene)}m from scene, auto-firing arrived (client)`
          );
          const nowIso = new Date().toISOString();
          updateDispatchLocally(dispatch.id, { status: 'arrived', arrived_at: nowIso });
          setArrivingDispatchId((prev) => (prev === dispatch.id ? null : prev));
          try {
            await updateDispatchStatusHook(dispatch.id, 'arrived');
          } catch (err: any) {
            const status = err.response?.status;
            if (status === 409 || status === 422) {
              console.log(
                '[DispatchContext] Client-arrived POST superseded by backend (already arrived):',
                status
              );
            } else {
              console.error(
                '[DispatchContext] Client-arrived POST failed:',
                err.response?.data || err.message
              );
              lastArrivedTriggeredRef.current = null;
              lastAutoArrivedDispatchRef.current = null;
              return;
            }
          }
          if (activeJourneyRef.current?.dispatchId === dispatch.id) {
            activeJourneyRef.current = null;
            await journeyState.clearActiveJourney();
          }
        }
      }
    },
    [updateDispatchStatusHook, updateDispatchLocally]
  );

  /**
   * **FIX #2 & #4: Send current location to backend with verification**
   * **FIX: Added 422 error recovery - sets duty status and retries**
   * Now also: drains offline location queue on success, enqueues on network failure,
   * and runs journey-tracker evaluations (live distance, auto en_route, client-arrived).
   */
  const sendLocationUpdate = useCallback(async () => {
    let location: { latitude: number; longitude: number; timestamp?: number } | null = null;
    try {
      location = await locationService.getCurrentLocation();
    } catch (gpsError: any) {
      console.error('[DispatchContext] GPS fix failed:', gpsError.message);
      const isGpsTimeout =
        gpsError.message?.includes('timeout') ||
        gpsError.message?.includes('timed out') ||
        gpsError.message?.includes('GPS');
      const bgActive = await isBackgroundTrackingActive();
      if (isGpsTimeout && bgActive) {
        console.log('[DispatchContext] GPS timeout but background tracking active — treating as OK');
        setIsBackendConfirmed(true);
        setLocationFailureCount(0);
      } else {
        setIsBackendConfirmed(false);
        setLocationFailureCount((prev) => prev + 1);
      }
      return;
    }

    if (!location) return;

    try {
      const response = await dispatchService.updateLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      console.log('📍 [DispatchContext] Location update response:', response);

      setLocationLastSent(new Date());
      setIsBackendConfirmed(true);
      setLocationFailureCount(0);

      if (response.auto_arrived) {
        handleAutoArrival(response.auto_arrived);
      }

      // Backend is reachable — drain buffered offline pings (up to 5 per tick)
      try {
        await locationQueue.drainQueue(async (p) => {
          await dispatchService.updateLocation({
            latitude: p.latitude,
            longitude: p.longitude,
          });
        }, 5);
      } catch (drainErr: any) {
        console.warn('[DispatchContext] Queue drain error:', drainErr.message);
      }

      // Live distance + auto-transitions (can fire POSTs — backend is reachable)
      await evaluateJourneyTransitions(
        { latitude: location.latitude, longitude: location.longitude },
        true
      );
    } catch (error: any) {
      const statusCode = error.response?.status;

      if (statusCode === 422) {
        console.error('❌ [DispatchContext] Location rejected - responder not on duty (422)');

        // **FIX: Attempt to recover by setting duty status again**
        try {
          console.log('[DispatchContext] Attempting to recover - setting duty status...');
          await dispatchService.updateDutyStatus({
            is_on_duty: true,
            responder_status: 'idle',
          });
          console.log('✅ [DispatchContext] Status recovered - retrying location update');

          const retryResponse = await dispatchService.updateLocation({
            latitude: location.latitude,
            longitude: location.longitude,
          });
          console.log('✅ [DispatchContext] Location update succeeded after recovery');
          setLocationLastSent(new Date());
          setIsBackendConfirmed(true);
          setLocationFailureCount(0);

          if (retryResponse.auto_arrived) {
            handleAutoArrival(retryResponse.auto_arrived);
          }

          await evaluateJourneyTransitions(
            { latitude: location.latitude, longitude: location.longitude },
            true
          );
        } catch (retryError: any) {
          console.error(
            '❌ [DispatchContext] Failed to recover status:',
            retryError.response?.data || retryError.message
          );
          setIsBackendConfirmed(false);
          setLocationFailureCount((prev) => prev + 1);
        }
      } else if (!error.response) {
        // Network-class error (no HTTP response) — buffer for later flush.
        console.warn('[DispatchContext] Location send offline — enqueuing ping:', error.message);
        await locationQueue.enqueuePing({
          latitude: location.latitude,
          longitude: location.longitude,
          capturedAt: new Date().toISOString(),
        });
        setIsBackendConfirmed(false);
        setLocationFailureCount((prev) => prev + 1);
        // Still update UI from the fresh GPS fix; skip transition POSTs (they'd also fail).
        await evaluateJourneyTransitions(
          { latitude: location.latitude, longitude: location.longitude },
          false
        );
      } else {
        console.error(
          '[DispatchContext] Foreground location update failed:',
          error.response?.data || error.message
        );
        setIsBackendConfirmed(false);
        setLocationFailureCount((prev) => prev + 1);
      }
    }
  }, [handleAutoArrival, evaluateJourneyTransitions]);

  /**
   * **FIX #2: Start periodic foreground location updates**
   * Interval is dynamic: 8s when en_route (for auto-arrival), 30s otherwise
   */
  const startPeriodicLocationUpdates = useCallback(() => {
    const hasEnRoute = dispatchesRef.current.some(d => d.status === 'en_route');
    const interval = hasEnRoute ? LOCATION_INTERVAL_EN_ROUTE : LOCATION_INTERVAL_DEFAULT;

    console.log(`[DispatchContext] Starting periodic foreground location updates (${interval}ms)`);

    // Clear any existing interval
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }

    currentIntervalRef.current = interval;
    locationIntervalRef.current = setInterval(sendLocationUpdate, interval);
  }, [sendLocationUpdate]);

  /**
   * **FIX #2: Stop periodic foreground location updates**
   */
  const stopPeriodicLocationUpdates = useCallback(() => {
    console.log('[DispatchContext] Stopping periodic foreground location updates');

    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  /**
   * Automatically start location tracking when permission is granted
   * Called on app entry and after permission grant
   */
  const autoStartTracking = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[DispatchContext] Auto-starting location tracking...');

      // **Step 1: Set duty status FIRST (backend requires on-duty before accepting location)**
      console.log('[DispatchContext] Step 1: Setting responder status to ON DUTY...');
      try {
        const dutyResponse = await dispatchService.updateDutyStatus({
          is_on_duty: true,
          responder_status: 'idle',
        });
        const confirmed = verifyDutyStatusResponse(dutyResponse, 'autoStartTracking');

        if (!confirmed) {
          Alert.alert(
            'Duty Status Warning',
            `Backend did not confirm "on duty" status. Dispatches may not appear. Please check with your administrator.`,
            [{ text: 'OK' }]
          );
        }
      } catch (dutyError: any) {
        console.error('❌ [DispatchContext] Failed to set duty status:', dutyError.message);
        setDutyStatusConfirmed(false);
        Alert.alert(
          'Duty Status Error',
          `Failed to set your status to "on duty" (${dutyError.message}). Dispatches may not appear. Please check your connection.`,
          [{ text: 'OK' }]
        );
      }

      // **Step 2: Send location now that we're on-duty**
      console.log('[DispatchContext] Step 2: Sending initial location update...');
      try {
        const location = await locationService.getCurrentLocation();
        if (location) {
          const locResponse = await dispatchService.updateLocation({
            latitude: location.latitude,
            longitude: location.longitude,
          });
          console.log('✅ [DispatchContext] Initial location sent:', {
            lat: location.latitude,
            lng: location.longitude,
            response: JSON.stringify(locResponse),
          });
          setLocationLastSent(new Date());
          setIsBackendConfirmed(true);
          setLocationFailureCount(0);
        }
      } catch (locError: any) {
        console.error('[DispatchContext] Initial location failed:', locError.response?.status, locError.response?.data || locError.message);
        setLocationFailureCount(prev => prev + 1);
      }

      // Request notification permission (do this early so dispatch alerts work)
      const notifPerm = await notificationService.initializeNotifications();
      if (!notifPerm) {
        Alert.alert(
          'Notification Permission',
          'Notifications are disabled. You may not receive dispatch alerts.',
          [{ text: 'OK' }]
        );
      }

      // Request background location permissions
      const locationPerm = await requestBackgroundLocationPermissions();
      setHasLocationPermission(locationPerm.granted);

      if (!locationPerm.granted) {
        console.warn('[DispatchContext] Background location permission denied — continuing with foreground-only tracking');

        // Show a non-blocking warning (don't return early!)
        Alert.alert(
          'Limited Location Tracking',
          'Background location was denied. Your location will only update while the app is open. Dispatches will still appear.',
          [
            { text: 'OK' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );

        // Skip background tracking but continue with foreground tracking + polling
        setIsTrackingActive(true);
      } else {
        // Start background location tracking
        await startBackgroundLocationTracking();
        setIsTrackingActive(true);
      }

      // **FIX #2: Start foreground fallback updates**
      startPeriodicLocationUpdates();

      // Start dispatch polling
      startPolling();

      console.log('[DispatchContext] Auto-start complete: tracking active');
    } catch (error: any) {
      console.error('[DispatchContext] Auto-start failed:', error);
      setError(error.message || 'Failed to start location tracking');
      Alert.alert(
        'Location Tracking Error',
        'Failed to start automatic location tracking. Please check your permissions.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [startPolling, startPeriodicLocationUpdates, verifyDutyStatusResponse]);

  /**
   * Stop location tracking and set duty status to offline
   * Called during logout
   */
  const stopTracking = useCallback(async () => {
    console.log('[DispatchContext] Stopping location tracking and setting duty status to offline...');

    try {
      // Stop polling first
      stopPolling();

      // Stop location tracking
      stopPeriodicLocationUpdates();
      await stopBackgroundLocationTracking();
      setIsTrackingActive(false);

      // Clear journey + arriving banner so the next session starts clean
      activeJourneyRef.current = null;
      lastEnRouteTriggeredRef.current = null;
      lastArrivedTriggeredRef.current = null;
      setArrivingDispatchId(null);
      setLiveDistances({});
      await journeyState.clearActiveJourney();

      // Set duty status to offline
      try {
        await dispatchService.updateDutyStatus({
          is_on_duty: false,
          responder_status: 'offline',
        });
        console.log('✅ [DispatchContext] Responder status set to OFF DUTY');
      } catch (error: any) {
        console.error('❌ [DispatchContext] Failed to set offline status:', error.message);
        // Don't throw - continue with logout even if backend fails
      }

      console.log('[DispatchContext] Location tracking stopped successfully');
    } catch (error: any) {
      console.error('[DispatchContext] Error stopping tracking:', error);
    }
  }, [stopPolling, stopPeriodicLocationUpdates]);

  /**
   * Update dispatch status wrapper.
   *
   * Also manages the persisted Responder Journey:
   *   - on `accepted`: capture current GPS as the accept-origin so the client-side
   *     geofence can auto-fire en_route at ~75m.
   *   - on `declined` / `cancelled` / `completed` / `arrived`: clear the journey
   *     (the trip is over; no more auto-transitions are possible).
   */
  const updateDispatchStatus = useCallback(
    async (dispatchId: number, status: DispatchStatus) => {
      // Pre-flight: capture accept-origin GPS BEFORE the POST so we don't lose it if
      // the user kills the app between POST and the next GPS fix.
      if (status === 'accepted') {
        try {
          const gps = await locationService.getCurrentLocation();
          if (gps) {
            const entry: journeyState.JourneyEntry = {
              dispatchId,
              acceptOriginLat: gps.latitude,
              acceptOriginLon: gps.longitude,
              acceptedAt: new Date().toISOString(),
            };
            activeJourneyRef.current = entry;
            lastEnRouteTriggeredRef.current = null;
            lastArrivedTriggeredRef.current = null;
            await journeyState.setActiveJourney(entry);
          } else {
            console.warn('[DispatchContext] Accept-origin capture skipped — no GPS available');
          }
        } catch (gpsErr: any) {
          console.warn(
            '[DispatchContext] Accept-origin capture failed (continuing accept):',
            gpsErr.message
          );
        }
      }

      try {
        const result = await updateDispatchStatusHook(dispatchId, status);

        // Terminal-ish statuses clear the journey (match only if id matches — user may
        // manually transition a different dispatch while another has an active journey).
        if (['declined', 'cancelled', 'completed', 'arrived'].includes(status)) {
          if (activeJourneyRef.current?.dispatchId === dispatchId) {
            activeJourneyRef.current = null;
            await journeyState.clearActiveJourney();
          }
          setArrivingDispatchId((prev) => (prev === dispatchId ? null : prev));
          setLiveDistances((prev) => {
            if (!(dispatchId in prev)) return prev;
            const next = { ...prev };
            delete next[dispatchId];
            return next;
          });
        }

        return result;
      } catch (error) {
        // Error already handled in hook
        throw error;
      }
    },
    [updateDispatchStatusHook]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
    clearPollingError();
  }, [clearPollingError]);

  /**
   * Auto-start tracking when responder enters the app
   * Stop tracking when responder logs out
   */
  useEffect(() => {
    // If user logs out, stop tracking
    if (!user) {
      console.log('[DispatchContext] User logged out, stopping tracking...');
      stopTracking();
      return;
    }

    // Only auto-start for responders
    if (user.role !== 'responder') return;

    console.log('[DispatchContext] Responder detected, checking auto-start...');

    // Always start polling immediately for responders so dispatches are received
    // even if tracking setup fails
    console.log('[DispatchContext] Starting dispatch polling for responder...');
    startPolling();

    // Hydrate persisted journey state so cold-restart mid-dispatch resumes auto-transitions.
    (async () => {
      const persisted = await journeyState.loadActiveJourney();
      if (persisted) {
        activeJourneyRef.current = persisted;
        lastEnRouteTriggeredRef.current = persisted.enRouteTriggeredAt ? persisted.dispatchId : null;
        lastArrivedTriggeredRef.current = persisted.arrivedTriggeredAt ? persisted.dispatchId : null;
      }
    })();

    // **Safety net: Check if already tracking, otherwise do full auto-start**
    (async () => {
      const isActive = await isBackgroundTrackingActive();
      if (isActive) {
        console.log('[DispatchContext] Background tracking already active, resuming...');

        // Request foreground permission so sendLocationUpdate can get GPS
        try {
          await locationService.requestLocationPermissions();
          setHasLocationPermission(true);
        } catch (e: any) {
          console.warn('[DispatchContext] Safety net: foreground permission request failed:', e.message);
        }

        // Set duty status to ensure backend knows we're on-duty
        try {
          const dutyResponse = await dispatchService.updateDutyStatus({
            is_on_duty: true,
            responder_status: 'idle',
          });
          verifyDutyStatusResponse(dutyResponse, 'safety-net-resume');
        } catch (e: any) {
          console.error('[DispatchContext] Safety net: Failed to set duty status:', e.message);
          setDutyStatusConfirmed(false);
        }

        // Send one location update to ensure backend has fresh GPS
        await sendLocationUpdate();

        setIsTrackingActive(true);
        startPeriodicLocationUpdates();
      } else {
        console.log('[DispatchContext] Starting auto-start sequence...');
        autoStartTracking();
      }
    })();

    // Cleanup on unmount
    return () => {
      stopPolling();
      // **FIX #2: Cleanup foreground location updates**
      stopPeriodicLocationUpdates();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /**
   * Sync error from polling hook
   */
  useEffect(() => {
    if (pollingError) {
      setError(pollingError);
    }
  }, [pollingError]);

  /**
   * Background location heartbeat — periodically check if background tracking is active
   * and bridge that to React state so UI shows correct location status
   */
  useEffect(() => {
    if (!isTrackingActive) return;

    const heartbeat = setInterval(async () => {
      const bgActive = await isBackgroundTrackingActive();
      if (bgActive && !isBackendConfirmed) {
        console.log('[DispatchContext] Heartbeat: background tracking active, setting isBackendConfirmed=true');
        setIsBackendConfirmed(true);
        setLocationFailureCount(0);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeat);
  }, [isTrackingActive, isBackendConfirmed]);

  /**
   * Dynamic location interval — adjust frequency based on dispatch status.
   * 8s when any dispatch is en_route (for auto-arrival detection), 30s otherwise.
   */
  useEffect(() => {
    if (!isTrackingActive || !locationIntervalRef.current) return;

    const hasEnRoute = dispatches.some(d => d.status === 'en_route');
    const newInterval = hasEnRoute ? LOCATION_INTERVAL_EN_ROUTE : LOCATION_INTERVAL_DEFAULT;

    if (newInterval !== currentIntervalRef.current) {
      console.log(`[DispatchContext] Adjusting location interval: ${currentIntervalRef.current}ms -> ${newInterval}ms`);
      currentIntervalRef.current = newInterval;

      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = setInterval(sendLocationUpdate, newInterval);
    }
  }, [isTrackingActive, dispatches, sendLocationUpdate]);

  /**
   * Notification listener — bridges background location task auto-arrival to React state.
   * When the background task detects auto-arrival, it fires a local notification with
   * data.type === 'auto_arrival'. This listener catches it and updates dispatch state
   * immediately, rather than waiting for the next poll cycle.
   */
  useEffect(() => {
    if (!isTrackingActive) return;

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as { type?: string; dispatchId?: number };
      const bgDispatchId = data?.dispatchId;
      if (data?.type === 'auto_arrival' && typeof bgDispatchId === 'number') {
        console.log('[DispatchContext] Auto-arrival notification received from background task:', bgDispatchId);

        // Deduplication: foreground sendLocationUpdate may have already handled this
        if (bgDispatchId === lastAutoArrivedDispatchRef.current) {
          console.log('[DispatchContext] Auto-arrival already processed, skipping');
          return;
        }

        // Update local state and fetch full server data
        lastAutoArrivedDispatchRef.current = bgDispatchId;
        updateDispatchLocally(bgDispatchId, { status: 'arrived' });
        refreshDispatches();

        // Banner off + journey cleared (trip is done)
        setArrivingDispatchId((prev) => (prev === bgDispatchId ? null : prev));
        if (activeJourneyRef.current?.dispatchId === bgDispatchId) {
          activeJourneyRef.current = null;
          journeyState.clearActiveJourney();
        }
      }
    });

    return () => subscription.remove();
  }, [isTrackingActive, updateDispatchLocally, refreshDispatches]);

  const value: DispatchContextType = {
    isTrackingActive,
    hasLocationPermission,
    locationLastSent,
    isBackendConfirmed,
    dutyStatusConfirmed,
    locationFailureCount,
    dispatches,
    activeDispatches,
    nearbyIncidents,
    lastPollTime,
    lastPollResult,
    liveDistances,
    arrivingDispatchId,
    autoStartTracking,
    stopTracking,
    updateDispatchStatus,
    refreshDispatches,
    retryDispatches: retryNow,
    isLoading,
    error,
    clearError,
  };

  return <DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>;
};

export const useDispatch = (): DispatchContextType => {
  const context = useContext(DispatchContext);
  if (context === undefined) {
    throw new Error('useDispatch must be used within a DispatchProvider');
  }
  return context;
};

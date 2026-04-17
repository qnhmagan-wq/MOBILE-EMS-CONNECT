/**
 * Journey State Service
 *
 * Persists the responder's current active dispatch journey to expo-secure-store
 * so the accept-origin survives cold restarts. Only one journey is tracked at a
 * time (the most-recently-accepted dispatch).
 */

import * as SecureStore from 'expo-secure-store';

const KEY = 'ems_active_journey_v1';

export type JourneyEntry = {
  dispatchId: number;
  acceptOriginLat: number;
  acceptOriginLon: number;
  acceptedAt: string; // ISO
  enRouteTriggeredAt?: string;
  arrivedTriggeredAt?: string;
};

export const loadActiveJourney = async (): Promise<JourneyEntry | null> => {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JourneyEntry;
    if (
      typeof parsed?.dispatchId !== 'number' ||
      typeof parsed?.acceptOriginLat !== 'number' ||
      typeof parsed?.acceptOriginLon !== 'number'
    ) {
      console.warn('[JourneyState] Stored entry malformed, clearing');
      await SecureStore.deleteItemAsync(KEY);
      return null;
    }
    console.log('[JourneyState] Loaded active journey dispatch=' + parsed.dispatchId);
    return parsed;
  } catch (err: any) {
    console.error('[JourneyState] Load failed:', err.message);
    return null;
  }
};

export const setActiveJourney = async (entry: JourneyEntry): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(entry));
    console.log(
      `[JourneyState] Saved active journey dispatch=${entry.dispatchId} origin=(${entry.acceptOriginLat.toFixed(5)},${entry.acceptOriginLon.toFixed(5)})`
    );
  } catch (err: any) {
    console.error('[JourneyState] Save failed:', err.message);
  }
};

export const updateActiveJourney = async (
  patch: Partial<JourneyEntry>
): Promise<JourneyEntry | null> => {
  const current = await loadActiveJourney();
  if (!current) return null;
  const next: JourneyEntry = { ...current, ...patch };
  await setActiveJourney(next);
  return next;
};

export const clearActiveJourney = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEY);
    console.log('[JourneyState] Cleared active journey');
  } catch (err: any) {
    console.error('[JourneyState] Clear failed:', err.message);
  }
};

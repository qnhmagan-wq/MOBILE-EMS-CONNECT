/**
 * Diagnostics Service
 *
 * Runtime state + structured logging for the field-test diagnostic overlay.
 *
 * - `snapshot` holds the latest ping + dispatch state; components subscribe
 *   via `useDiagnosticsSnapshot()` and re-render when it changes.
 * - `emit(event, data)` writes a single-line JSON log prefixed `EMSDIAG` so
 *   testers can grep `adb logcat` or Xcode Console. These logs run in both
 *   dev and release builds (they're low-volume — one per 5s ping).
 * - `overlayVisible` is persisted to expo-secure-store so the toggle survives
 *   app restarts.
 *
 * All of this is inert on production builds where `DIAG_TOGGLE_ENABLED=false`
 * — the provider still runs (state updates still flow, so turning on the
 * flag in a hotfix would start showing data immediately), but the 5-tap
 * gesture is a no-op and the overlay component checks the flag before
 * rendering.
 */

import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

const OVERLAY_VISIBLE_KEY = 'ems_diag_overlay_visible_v1';

export type PingStatus = 'OK' | 'NETWORK' | 'HTTP';

export interface DiagSnapshot {
  // Ping
  lastPingAt: number | null;           // epoch ms of the last attempted ping
  lastPingStatus: PingStatus | null;
  lastPingHttpCode: number | null;     // HTTP status code (200/422/500/...)
  // Accuracy echo from the last outgoing body
  lastPingAccuracy: number | null;
  lastPingAccuracyPresent: boolean;
  // Last server snapshot
  dispatchId: number | null;
  dispatchStatus: string | null;
  serverDistanceMeters: number | null;
  etaSeconds: number | null;
  // Auto-arrival
  autoArrivedAt: number | null;        // epoch ms when server fired auto_arrived
  autoArrivedDispatchId: number | null;
  // Last error (short form for the overlay)
  lastErrorShort: string | null;
  lastErrorAt: number | null;
}

const initial: DiagSnapshot = {
  lastPingAt: null,
  lastPingStatus: null,
  lastPingHttpCode: null,
  lastPingAccuracy: null,
  lastPingAccuracyPresent: false,
  dispatchId: null,
  dispatchStatus: null,
  serverDistanceMeters: null,
  etaSeconds: null,
  autoArrivedAt: null,
  autoArrivedDispatchId: null,
  lastErrorShort: null,
  lastErrorAt: null,
};

let snapshot: DiagSnapshot = initial;
const listeners = new Set<() => void>();

const notify = () => {
  for (const l of listeners) l();
};

export const getDiagSnapshot = (): DiagSnapshot => snapshot;

export const subscribeDiag = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * React hook for consuming the snapshot. Uses useSyncExternalStore so the
 * overlay re-renders whenever any caller mutates diag state.
 */
export const useDiagnosticsSnapshot = (): DiagSnapshot =>
  useSyncExternalStore(subscribeDiag, getDiagSnapshot, getDiagSnapshot);

const merge = (patch: Partial<DiagSnapshot>) => {
  snapshot = { ...snapshot, ...patch };
  notify();
};

// --- State mutators ---------------------------------------------------------

export const recordPingSuccess = (params: {
  accuracy: number | null;
  accuracyPresent: boolean;
  dispatchId: number | null;
  dispatchStatus: string | null;
  distanceMeters: number | null;
  etaSeconds: number | null;
  httpStatus: number;
}) => {
  merge({
    lastPingAt: Date.now(),
    lastPingStatus: 'OK',
    lastPingHttpCode: params.httpStatus,
    lastPingAccuracy: params.accuracy,
    lastPingAccuracyPresent: params.accuracyPresent,
    dispatchId: params.dispatchId,
    dispatchStatus: params.dispatchStatus,
    serverDistanceMeters: params.distanceMeters,
    etaSeconds: params.etaSeconds,
  });
};

export const recordPingFailure = (params: {
  accuracy: number | null;
  accuracyPresent: boolean;
  httpStatus: number | null;   // null for network/no-response errors
  shortMessage: string;
}) => {
  merge({
    lastPingAt: Date.now(),
    lastPingStatus: params.httpStatus == null ? 'NETWORK' : 'HTTP',
    lastPingHttpCode: params.httpStatus,
    lastPingAccuracy: params.accuracy,
    lastPingAccuracyPresent: params.accuracyPresent,
    lastErrorShort: params.shortMessage,
    lastErrorAt: Date.now(),
  });
};

export const recordAutoArrived = (dispatchId: number, arrivedAtIso: string) => {
  const ms = Date.parse(arrivedAtIso);
  merge({
    autoArrivedAt: Number.isFinite(ms) ? ms : Date.now(),
    autoArrivedDispatchId: dispatchId,
    dispatchStatus: 'arrived',
  });
};

export const recordError = (shortMessage: string) => {
  merge({ lastErrorShort: shortMessage, lastErrorAt: Date.now() });
};

// --- EMSDIAG structured log -------------------------------------------------

/**
 * Emit a single-line JSON log prefixed `EMSDIAG`. Runs in dev + release.
 * Volume: one per 5 s ping plus a handful of transition events — safe to
 * leave on in field builds.
 */
export const emsdiagLog = (event: string, data: Record<string, unknown> = {}) => {
  try {
    const payload = { event, ...data, ts: new Date().toISOString() };
    console.log('EMSDIAG ' + JSON.stringify(payload));
  } catch {
    // Never throw from a logger.
  }
};

// --- Overlay visibility toggle (persisted) ----------------------------------

let overlayVisible = false;
let overlayLoaded = false;
const overlayListeners = new Set<() => void>();

const notifyOverlay = () => {
  for (const l of overlayListeners) l();
};

export const getOverlayVisible = (): boolean => overlayVisible;

export const subscribeOverlay = (listener: () => void): (() => void) => {
  overlayListeners.add(listener);
  return () => {
    overlayListeners.delete(listener);
  };
};

export const useOverlayVisible = (): boolean =>
  useSyncExternalStore(subscribeOverlay, getOverlayVisible, getOverlayVisible);

export const loadOverlayVisibility = async (): Promise<void> => {
  if (overlayLoaded) return;
  overlayLoaded = true;
  try {
    const raw = await SecureStore.getItemAsync(OVERLAY_VISIBLE_KEY);
    if (raw === '1') {
      overlayVisible = true;
      notifyOverlay();
    }
  } catch (err: any) {
    console.warn('[Diagnostics] Failed to load overlay visibility:', err?.message);
  }
};

export const setOverlayVisible = async (next: boolean): Promise<void> => {
  overlayVisible = next;
  notifyOverlay();
  try {
    await SecureStore.setItemAsync(OVERLAY_VISIBLE_KEY, next ? '1' : '0');
  } catch (err: any) {
    console.warn('[Diagnostics] Failed to persist overlay visibility:', err?.message);
  }
};

export const toggleOverlayVisible = async (): Promise<boolean> => {
  const next = !overlayVisible;
  await setOverlayVisible(next);
  emsdiagLog('overlay_toggled', { visible: next });
  return next;
};

/**
 * Reset diagnostic state. Used on logout to avoid showing stale data under
 * the next responder.
 */
export const resetDiagnostics = () => {
  snapshot = initial;
  notify();
};

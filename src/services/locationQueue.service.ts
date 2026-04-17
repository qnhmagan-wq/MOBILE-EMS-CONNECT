/**
 * Location Queue Service
 *
 * Offline ring buffer for location pings. When the backend is unreachable
 * (airplane mode, no signal), pings are stored here and drained on the next
 * successful send. Backed by expo-secure-store; capped at MAX_ENTRIES to stay
 * under the 2 KB per-key safe window on iOS.
 */

import * as SecureStore from 'expo-secure-store';

const KEY = 'ems_loc_queue_v1';
const MAX_ENTRIES = 30;

export type QueuedPing = {
  latitude: number;
  longitude: number;
  capturedAt: string; // ISO
};

type Tuple = [number, number, string];

const load = async (): Promise<Tuple[]> => {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Tuple[]) : [];
  } catch (err: any) {
    console.error('[LocationQueue] Load failed:', err.message);
    return [];
  }
};

const save = async (entries: Tuple[]): Promise<void> => {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(entries));
  } catch (err: any) {
    console.error('[LocationQueue] Save failed:', err.message);
  }
};

const toPing = ([lat, lon, ts]: Tuple): QueuedPing => ({
  latitude: lat,
  longitude: lon,
  capturedAt: ts,
});

export const enqueuePing = async (p: QueuedPing): Promise<void> => {
  const entries = await load();
  entries.push([p.latitude, p.longitude, p.capturedAt]);
  let evicted = 0;
  while (entries.length > MAX_ENTRIES) {
    entries.shift();
    evicted += 1;
  }
  if (evicted > 0) {
    console.warn(`[LocationQueue] Evicting oldest ping (cap ${MAX_ENTRIES})`);
  }
  await save(entries);
  console.log(`[LocationQueue] Enqueued ping (queue size: ${entries.length})`);
};

export const getQueueSize = async (): Promise<number> => {
  const entries = await load();
  return entries.length;
};

/**
 * Drain up to `max` oldest pings through `sender`. Stops on first throw so
 * order is preserved and the failing ping stays at the head for the next try.
 */
export const drainQueue = async (
  sender: (p: QueuedPing) => Promise<void>,
  max: number = 5
): Promise<number> => {
  const entries = await load();
  if (entries.length === 0) return 0;

  const target = Math.min(max, entries.length);
  const total = entries.length;
  let sent = 0;

  for (let i = 0; i < target; i += 1) {
    const ping = toPing(entries[0]);
    try {
      await sender(ping);
      entries.shift();
      sent += 1;
    } catch (err: any) {
      // Persist progress made so far before bailing.
      await save(entries);
      console.warn(
        `[LocationQueue] Drain aborted after ${sent}/${target} (remaining ${entries.length}): ${err.message}`
      );
      return sent;
    }
  }

  await save(entries);
  if (sent > 0) {
    console.log(`[LocationQueue] Drained ${sent} of ${total}`);
  }
  return sent;
};

export const clearQueue = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(KEY);
    console.log('[LocationQueue] Cleared');
  } catch (err: any) {
    console.error('[LocationQueue] Clear failed:', err.message);
  }
};

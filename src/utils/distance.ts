/**
 * Distance utilities — Haversine + human-readable formatter.
 * Shared by the dispatch journey tracker, responder UI, and directory screens.
 */

export type LatLng = {
  latitude: number;
  longitude: number;
};

/**
 * Great-circle distance between two coordinates, in meters.
 */
export const haversineMeters = (a: LatLng, b: LatLng): number => {
  const R = 6371e3;
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;

  const h =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return R * c;
};

/**
 * Format meters as "N m" under 1 km, "N.N km" otherwise.
 */
export const formatDistance = (meters: number): string => {
  if (!Number.isFinite(meters) || meters < 0) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

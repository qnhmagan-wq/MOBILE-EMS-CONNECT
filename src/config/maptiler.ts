/**
 * MapTiler Cloud Configuration
 *
 * Service: https://cloud.maptiler.com
 * API Key: lU5X51Idm1eO5dvPBm6Z
 *
 * Free tier limits:
 * - 100,000 tile loads per month
 * - Multiple map styles available
 * - Worldwide coverage
 */

export const MAPTILER_API_KEY = 'lU5X51Idm1eO5dvPBm6Z';

/**
 * MapTiler map styles with tile URL templates
 * Supports zoom levels 0-19
 *
 * URL format: https://api.maptiler.com/maps/{style}/{z}/{x}/{y}.{format}?key={apiKey}
 */
export const MAPTILER_STYLES = {
  /** Street map - default, good for navigation and EMS dispatch */
  streets: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,

  /** Outdoor map - great for hiking, terrain visualization */
  outdoor: `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,

  /** Hybrid - satellite imagery with street labels */
  satellite: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}`,

  /** Basic map - minimal design, faster loading */
  basic: `https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
} as const;

/** Default style for EMS dispatch - street map with clear labels */
export const DEFAULT_MAPTILER_STYLE = MAPTILER_STYLES.streets;

/** Maximum zoom level supported by MapTiler */
export const MAPTILER_MAX_ZOOM = 19;

/** Minimum zoom level */
export const MAPTILER_MIN_ZOOM = 0;

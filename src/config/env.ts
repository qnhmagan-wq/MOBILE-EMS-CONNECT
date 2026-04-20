// Production API URL - HARDCODED for release builds
// In development, you can override with .env file
const PRODUCTION_API_URL = 'https://emsconnect.online/api';
const PRODUCTION_AGORA_APP_ID = 'c4cddb83dfe64cf19536d61427c97edd';

// Determine the API URL
// Priority: 1. Environment variable (for dev), 2. Production URL
const getApiBaseUrl = (): string => {
  // Check if environment variable is set (works in development)
  if (process.env.EXPO_PUBLIC_API_BASE_URL && process.env.EXPO_PUBLIC_API_BASE_URL !== '') {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  // Use production URL for release builds
  return PRODUCTION_API_URL;
};

const getAgoraAppId = (): string => {
  if (process.env.EXPO_PUBLIC_AGORA_APP_ID && process.env.EXPO_PUBLIC_AGORA_APP_ID !== '') {
    return process.env.EXPO_PUBLIC_AGORA_APP_ID;
  }
  return PRODUCTION_AGORA_APP_ID;
};

// Field-test diagnostic overlay. Gated on an explicit env flag so production
// store builds never install the 5-tap handler. Dev builds get it for free
// via __DEV__ so no one has to fiddle with .env locally.
const getDiagToggleEnabled = (): boolean => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  return process.env.EXPO_PUBLIC_DIAG_TOGGLE_ENABLED === 'true';
};

const ENV = {
  API_BASE_URL: getApiBaseUrl(),
  AGORA_APP_ID: getAgoraAppId(),
  DIAG_TOGGLE_ENABLED: getDiagToggleEnabled(),
};

// Log environment configuration on load
console.log('[ENV CONFIG] API_BASE_URL:', ENV.API_BASE_URL);
console.log('[ENV CONFIG] Environment:', typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production');
console.log('[ENV CONFIG] DIAG_TOGGLE_ENABLED:', ENV.DIAG_TOGGLE_ENABLED);

export default ENV;

// Google Maps API Key for Directions API
export const GOOGLE_MAPS_API_KEY = 'AIzaSyC_OBg78CHbVJM3_k17wqfPQBlnh27bfa4';

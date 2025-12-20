// Production API URL - HARDCODED for release builds
// In development, you can override with .env file
const PRODUCTION_API_URL = 'https://emsconnect.online/api';
const PRODUCTION_AGORA_APP_ID = 'c81a013cd0db4defabcbdb7d005fe627';

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

const ENV = {
  API_BASE_URL: getApiBaseUrl(),
  AGORA_APP_ID: getAgoraAppId(),
};

// Log environment configuration on load
console.log('[ENV CONFIG] API_BASE_URL:', ENV.API_BASE_URL);
console.log('[ENV CONFIG] Environment:', typeof __DEV__ !== 'undefined' && __DEV__ ? 'development' : 'production');

export default ENV;

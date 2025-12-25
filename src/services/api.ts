import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import ENV from '@/src/config/env';
import { getToken, clearAll } from './storage.service';

const api: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Comprehensive request logging
    console.log('[API REQUEST]', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
      params: config.params,
      timestamp: new Date().toISOString(),
    });

    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[API REQUEST ERROR]', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Comprehensive response logging
    console.log('[API RESPONSE]', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      timestamp: new Date().toISOString(),
    });
    return response;
  },
  async (error: AxiosError) => {
    // Comprehensive error logging with stack traces
    if (error.response) {
      // Server responded with error status
      console.error('[API RESPONSE ERROR]', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('[API NETWORK ERROR]', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        message: 'No response received from server',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Error in request setup
      console.error('[API ERROR]', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle 401 Unauthorized - clear auth and redirect to login
    if (error.response?.status === 401) {
      console.log('[API] 401 Unauthorized - Clearing auth data');
      await clearAll();
    }

    return Promise.reject(error);
  }
);

export default api;

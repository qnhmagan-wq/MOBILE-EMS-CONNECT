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
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      console.error(`[API Response Error] ${error.response.status}`, error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('[API Network Error] No response received:', error.message);
      console.error('[API Request Details]', error.config?.url);
    } else {
      // Error in request setup
      console.error('[API Error]', error.message);
    }

    if (error.response?.status === 401) {
      await clearAll();
    }
    return Promise.reject(error);
  }
);

export default api;

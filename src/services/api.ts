import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import ENV from '@/src/config/env';
import { getToken, clearAll } from './storage.service';

const api: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearAll();
    }
    return Promise.reject(error);
  }
);

export default api;

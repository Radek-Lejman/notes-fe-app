import axios from 'axios';
import { setupErrorInterceptor } from './interceptors/error.interceptor';
import { queryClient } from '../queryClient';

export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Attach interceptors
setupErrorInterceptor(apiClient, {
  refreshFn: () => apiClient.post('/auth/refresh'),
  onUnauthorized: () => {
    queryClient.clear();
  },
});

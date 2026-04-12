import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { isApiErrorResponseData } from '../../lib/typeGuards';
import { ApiError } from '../lib/ApiError';
import { RefreshQueueManager } from '../lib/RefreshQueueManager';
import { handle401Error } from '../handlers/handle401Error';
import type { SetupErrorInterceptorOptions } from './types';

const refreshManager = new RefreshQueueManager();

export const setupErrorInterceptor = (
  client: AxiosInstance,
  options: SetupErrorInterceptorOptions = {},
) => {
  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig;

      const responseData = error.response?.data;
      const message = isApiErrorResponseData(responseData)
        ? (responseData.message ?? error.message ?? 'Unknown API error')
        : (error.message ?? 'Unknown API error');

      const apiError = new ApiError(error.response?.status ?? 0, message, responseData);

      if (apiError.status === 401 && !originalRequest._skipAuthRefresh) {
        return handle401Error({
          client,
          originalRequest,
          apiError,
          options,
          refreshManager,
        });
      }

      console.error('API Error:', apiError);
      return Promise.reject(apiError);
    },
  );
};

import type { AuthHandlerContext } from './types';
import { normalizeError } from '../../../lib/error';

export const handle401Error = async (context: AuthHandlerContext): Promise<unknown> => {
  const { client, originalRequest, apiError, options, refreshManager } = context;

  if (originalRequest._retry) {
    return Promise.reject(apiError);
  }

  if (originalRequest.url?.includes('/auth/refresh')) {
    options.onUnauthorized?.();
    return Promise.reject(apiError);
  }

  if (refreshManager.isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshManager.add(resolve, reject);
    })
      .then(() => client(originalRequest))
      .catch((err: unknown) => Promise.reject(normalizeError(err)));
  }

  originalRequest._retry = true;
  refreshManager.setRefreshing(true);

  try {
    if (options.refreshFn) {
      await options.refreshFn();
      refreshManager.process(null);
      return client(originalRequest);
    }
  } catch (refreshError) {
    const processedError =
      refreshError instanceof Error ? refreshError : new Error(String(refreshError));

    refreshManager.process(processedError);
    options.onUnauthorized?.();
    return Promise.reject(apiError);
  } finally {
    refreshManager.setRefreshing(false);
  }

  options.onUnauthorized?.();
  return Promise.reject(apiError);
};

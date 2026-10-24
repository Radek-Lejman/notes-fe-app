import { normalizeError } from '../../../lib/error';
import { isAxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

type GetTokenFn = () => Promise<{ csrfToken: string }>;

/**
 * The AxiosError behind a response error. An interceptor registered earlier (the error
 * interceptor in client.ts) may already have turned it into an ApiError that keeps it as `cause`.
 */
const toAxiosError = (error: unknown) => {
  if (isAxiosError(error)) return error;
  if (error instanceof Error && isAxiosError(error.cause)) return error.cause;
  return null;
};

/**
 * csurf rejects with a plain 403; the API's own 403s (e.g. AI_CREDENTIALS_REQUIRED) carry a
 * `code` and would fail again with a fresh token.
 */
const hasApiErrorCode = (data: unknown) =>
  typeof data === 'object' && data !== null && 'code' in data;

export const setupCsrfInterceptor = (
  client: AxiosInstance,
  options: { getCsrfToken: GetTokenFn },
) => {
  let csrfToken: string | null = null;

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const method = config.method?.toUpperCase();

      const requiresCsrf =
        method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';

      if (!requiresCsrf) return config;

      if (!csrfToken) {
        const { csrfToken: newToken } = await options.getCsrfToken();
        csrfToken = newToken;
      }

      config.headers['X-CSRF-Token'] = csrfToken!;
      return config;
    },
    (error: unknown) => Promise.reject(normalizeError(error)),
  );

  client.interceptors.response.use(
    (res) => res,
    // An ApiError (error interceptor registered first) or an AxiosError (this one first).
    async (error: Error) => {
      const axiosError = toAxiosError(error);
      const config = axiosError?.config;

      if (
        axiosError?.response?.status === 403 &&
        config &&
        !config._csrfRetry &&
        !hasApiErrorCode(axiosError.response.data)
      ) {
        const { csrfToken: newToken } = await options.getCsrfToken();
        csrfToken = newToken;

        config._csrfRetry = true;
        config.headers['X-CSRF-Token'] = csrfToken;
        return client.request(config);
      }

      return Promise.reject(error);
    },
  );
};

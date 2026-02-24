import { apiClient } from "@shared/api/axios/client";
import { setupCsrfInterceptor } from "@shared/api/axios/interceptors/csrf.interceptor";
import { AuthApi } from "@entities/session";

/**
 * Initializes the API client with specific feature dependencies.
 * This acts as the Composition Root for the API layer.
 */
export const initApiConfig = () => {
  setupCsrfInterceptor(apiClient, {
    getCsrfToken: AuthApi.getCsrfToken
  });
};

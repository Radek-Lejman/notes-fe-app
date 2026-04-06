import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "../lib/ApiError";
import type { RefreshQueueManager } from "../lib/RefreshQueueManager";
import type { SetupErrorInterceptorOptions } from "../interceptors/types";

export interface AuthHandlerContext {
  client: AxiosInstance;
  originalRequest: InternalAxiosRequestConfig & { _retry?: boolean };
  apiError: ApiError;
  options: SetupErrorInterceptorOptions;
  refreshManager: RefreshQueueManager;
}

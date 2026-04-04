import type { AxiosError, AxiosInstance } from "axios";
import { isApiErrorResponseData } from "../../lib/typeGuards";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const setupErrorInterceptor = (client: AxiosInstance) => {
  client.interceptors.response.use(
    (res) => res,
    (error: AxiosError) => {
      const responseData = error.response?.data;
      const message = isApiErrorResponseData(responseData)
        ? responseData.message ?? error.message ?? "Unknown API error"
        : error.message ?? "Unknown API error";

      const apiError = new ApiError(
        error.response?.status ?? 0,
        message,
        responseData
      );

      console.error("API Error:", apiError);

      return Promise.reject(apiError);
    }
  );
};

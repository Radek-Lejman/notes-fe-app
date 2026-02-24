import type { AxiosError, AxiosInstance } from "axios";

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(status: number, message: string, details?: any) {
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
      const apiError = new ApiError(
        error.response?.status ?? 0,
        (error.response?.data as any)?.message ??
          error.message ??
          "Unknown API error",
        error.response?.data
      );

      console.error("API Error:", apiError);

      return Promise.reject(apiError);
    }
  );
};

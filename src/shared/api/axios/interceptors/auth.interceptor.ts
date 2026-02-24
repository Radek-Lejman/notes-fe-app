import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

export const setupAuthInterceptor = (client: AxiosInstance) => {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem("accessToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
};

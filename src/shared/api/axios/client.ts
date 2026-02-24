import axios from "axios";
import { setupAuthInterceptor } from "./interceptors/auth.interceptor";
import { setupErrorInterceptor } from "./interceptors/error.interceptor";


export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach interceptors
setupAuthInterceptor(apiClient);
setupErrorInterceptor(apiClient);

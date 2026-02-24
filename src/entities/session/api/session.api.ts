import { apiClient } from "@shared/api/axios/client";
import type {
  CsrfResponse,
  LoginDto,
  MessageResponse,
  RegisterDto,
  User,
} from "../model/session.types";

export const AuthApi = {
  login: async (dto: LoginDto): Promise<MessageResponse> => {
    const { data } = await apiClient.post("/auth/login", dto);
    return data;
  },

  register: async (dto: RegisterDto): Promise<MessageResponse> => {
    const { data } = await apiClient.post("/auth/register", dto);
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },

  refresh: async (): Promise<MessageResponse> => {
    const { data } = await apiClient.post("/auth/refresh");
    return data;
  },

  logout: async (): Promise<MessageResponse> => {
    const { data } = await apiClient.post("/auth/logout");
    return data;
  },

  getCsrfToken: async (): Promise<CsrfResponse> => {
    const { data } = await apiClient.get("/csrf-token");
    return data;
  },
};

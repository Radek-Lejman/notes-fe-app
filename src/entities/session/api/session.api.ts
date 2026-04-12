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
    const { data } = await apiClient.post<MessageResponse>("/auth/login", dto);
    return data;
  },

  register: async (dto: RegisterDto): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>("/auth/register", dto);
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>("/auth/me", {
      _skipAuthRefresh: true,
    });
    return data;
  },

  refresh: async (): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>("/auth/refresh");
    return data;
  },

  logout: async (): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>("/auth/logout");
    return data;
  },

  getCsrfToken: async (): Promise<CsrfResponse> => {
    const { data } = await apiClient.get<CsrfResponse>("/csrf-token");
    return data;
  },
};

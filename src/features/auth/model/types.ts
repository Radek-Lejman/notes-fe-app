import type { ReactNode } from "react";
import type { User } from "@entities/session";
import { AuthApi } from "@entities/session";

export type LoginCredentials = Parameters<typeof AuthApi.login>[0];
export type RegisterCredentials = Parameters<typeof AuthApi.register>[0];

export interface AuthFormProps {
  mode: "Login" | "Register";
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (credentials: LoginCredentials) => void;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
}

export interface ShowOnlyUserProps {
  children: (user: User) => ReactNode;
  fallback?: ReactNode;
}

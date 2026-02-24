import { Navigate } from "react-router-dom";
import type { JSX } from "react";
import { useSession } from "@entities/session";

export const RedirectIfAuth = ({ children }: { children: JSX.Element }) => {
  const { data: user, isLoading } = useSession();

  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;

  return children;
};
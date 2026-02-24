import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../../../../entities/session/api/useSession";

export const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { data: user, isLoading } = useSession();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};
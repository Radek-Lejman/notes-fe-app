import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AuthApi } from "@entities/session";

type LoginCredentials = Parameters<typeof AuthApi.login>[0];

export const useLogin = () => {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return AuthApi.login(credentials);
    },
    onSuccess: () => {
      navigate("/");
    },
    onError: (err) => {
      console.error("Failed to login:", err);
    },
  });

  return {
    submitLogin: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
  };
};

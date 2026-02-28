import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AuthApi } from "@entities/session";

//  TODO move types to other folder
type RegisterCredentials = Parameters<typeof AuthApi.register>[0];

export const useRegister = () => {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      return AuthApi.register(credentials);
    },
    onSuccess: () => {
      navigate("/");
    },
    onError: (err) => {
      console.error("Failed to register:", err);
    },
  });

  return {
    submitRegistration: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
  };
};

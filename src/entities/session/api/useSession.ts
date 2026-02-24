import { useQuery } from "@tanstack/react-query";
import { authQueryKeys, AuthApi } from "@entities/session";  
import { SESSION_STALE_DURATION_MS } from "@shared/api/constants/api.constants";

export const useSession = () => {
  return useQuery({
    queryKey: authQueryKeys.auth.me(),
    queryFn: AuthApi.me,
    staleTime: SESSION_STALE_DURATION_MS,
    retry: false,
  });
};
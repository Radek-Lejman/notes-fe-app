import { useQuery } from '@tanstack/react-query';
import { authQueryKeys } from './sessionKeys';
import { AuthApi } from './session.api';
import { SESSION_STALE_DURATION_MS } from '@shared/api/constants/api.constants';

export const useSession = () => {
  return useQuery({
    queryKey: authQueryKeys.auth.me(),
    queryFn: AuthApi.me,
    staleTime: SESSION_STALE_DURATION_MS,
    retry: false,
  });
};

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { AiChatApi } from '../aiChatApi';
import { aiKeys } from '../aiKeys';
import type { AiSettings } from '../../model/types';

type AiSettingsQueryOptions = Pick<
  UseQueryOptions<AiSettings, Error, AiSettings, ReturnType<typeof aiKeys.settings>>,
  'refetchInterval'
>;

export const useAiSettings = (options: AiSettingsQueryOptions = {}) =>
  useQuery({ queryKey: aiKeys.settings(), queryFn: AiChatApi.getSettings, ...options });

export const useSaveAiCredential = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: AiChatApi.saveCredential,
    onSuccess: () => client.invalidateQueries({ queryKey: aiKeys.settings() }),
  });
};

export const useRemoveAiCredential = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: AiChatApi.removeCredential,
    onSuccess: () => client.invalidateQueries({ queryKey: aiKeys.settings() }),
  });
};

export const useTestAiCredential = () => useMutation({ mutationFn: AiChatApi.testCredential });

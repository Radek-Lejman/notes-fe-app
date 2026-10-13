import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AiChatApi } from '../aiChatApi';
import { aiKeys } from '../aiKeys';

export const useAiSettings = () =>
  useQuery({ queryKey: aiKeys.settings(), queryFn: AiChatApi.getSettings });

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

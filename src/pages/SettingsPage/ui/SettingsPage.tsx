import { Heading, Stack } from '@chakra-ui/react';
import MainLayout from '@shared/ui/layouts/MainLayout/MainLayout';
import { AiSettingsPanel } from '@features/ai-settings';

export const SettingsPage = () => {
  return (
    <MainLayout title="Settings">
      <Stack gap={3} maxW="xl">
        <Heading size="md">AI assistant</Heading>
        <AiSettingsPanel />
      </Stack>
    </MainLayout>
  );
};

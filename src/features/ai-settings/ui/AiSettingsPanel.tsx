import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Field,
  HStack,
  Input,
  NativeSelect,
  Separator,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import {
  useAiSettings,
  useRemoveAiCredential,
  useSaveAiCredential,
  useTestAiCredential,
  type CredentialType,
} from '@entities/ai-chat';
import { normalizeError } from '@shared/lib/error';
import { CREDENTIAL_OPTIONS } from '../config/credentialOptions';

/** Connect the user's own Claude account and see the AI/RAG status. */
export const AiSettingsPanel = () => {
  const { data: settings, isLoading, error } = useAiSettings();
  const save = useSaveAiCredential();
  const remove = useRemoveAiCredential();
  const test = useTestAiCredential();
  const [type, setType] = useState<CredentialType>('claude-oauth-token');
  const [secret, setSecret] = useState('');

  if (isLoading) return <Spinner size="sm" />;
  if (error || !settings) {
    return <Text color="red.500">Could not load AI settings: {normalizeError(error).message}</Text>;
  }

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    test.reset();
    save.mutate(
      { type, secret: secret.trim() },
      // The secret is not kept in the browser once the server has it.
      { onSuccess: () => setSecret('') },
    );
  };

  const option = CREDENTIAL_OPTIONS[type];
  const { credential, rag } = settings;

  return (
    <Stack gap={4} fontSize="sm">
      <Text color="gray.500">
        Engine: {settings.provider} · model {settings.model}
      </Text>

      {!settings.requiresAccount ? (
        <Alert.Root status="info">
          <Alert.Indicator />
          <Alert.Title>Runs on a local model — no account needed.</Alert.Title>
        </Alert.Root>
      ) : (
        <>
          {credential ? (
            <Alert.Root status="success">
              <Alert.Indicator />
              <Box>
                <Alert.Title>Your Claude account is connected</Alert.Title>
                <Alert.Description>
                  {CREDENTIAL_OPTIONS[credential.type].label} {credential.hint} · updated{' '}
                  {new Date(credential.updatedAt).toLocaleDateString()}
                </Alert.Description>
              </Box>
            </Alert.Root>
          ) : settings.serverLoginAllowed ? (
            <Alert.Root status="info">
              <Alert.Indicator />
              <Box>
                <Alert.Title>Using this server&apos;s Claude login</Alert.Title>
                <Alert.Description>
                  You can connect your own account instead — it will be used first.
                </Alert.Description>
              </Box>
            </Alert.Root>
          ) : (
            <Alert.Root status="warning">
              <Alert.Indicator />
              <Box>
                <Alert.Title>Connect your Claude account</Alert.Title>
                <Alert.Description>
                  Each person uses their own Claude account. Your requests are billed only to it.
                </Alert.Description>
              </Box>
            </Alert.Root>
          )}

          {(credential || settings.serverLoginAllowed) && (
            <HStack>
              <Button
                size="xs"
                variant="outline"
                onClick={() => test.mutate()}
                loading={test.isPending}
              >
                Test connection
              </Button>
              {credential && (
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => {
                    test.reset();
                    remove.mutate();
                  }}
                  loading={remove.isPending}
                >
                  Disconnect
                </Button>
              )}
            </HStack>
          )}
          {test.data && (
            <Text color={test.data.ok ? 'green.600' : 'red.500'}>{test.data.message}</Text>
          )}
          {test.error && <Text color="red.500">{normalizeError(test.error).message}</Text>}

          <Box as="form" onSubmit={handleSave}>
            <Stack gap={3}>
              <Field.Root>
                <Field.Label>{credential ? 'Replace with' : 'Account type'}</Field.Label>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={type}
                    onChange={(e) => setType(e.target.value as CredentialType)}
                  >
                    {Object.entries(CREDENTIAL_OPTIONS).map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>

              <Field.Root invalid={!!save.error}>
                <Input
                  size="sm"
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={option.placeholder}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
                <Field.HelperText>{option.help}</Field.HelperText>
                {save.error && (
                  <Field.ErrorText>{normalizeError(save.error).message}</Field.ErrorText>
                )}
              </Field.Root>

              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.500">
                  Stored encrypted on the server, never shown again.
                </Text>
                <Button
                  type="submit"
                  size="xs"
                  colorPalette="blue"
                  disabled={secret.trim().length < 20}
                  loading={save.isPending}
                >
                  Save
                </Button>
              </HStack>
            </Stack>
          </Box>
        </>
      )}

      <Separator />

      <Box>
        <Text fontWeight="medium">Semantic search (RAG)</Text>
        {rag.enabled ? (
          <Text color="gray.500">
            On · {rag.embeddingModel}
            {rag.stats &&
              ` · ${rag.stats.indexedNotes}/${rag.stats.totalNotes} notes indexed (${rag.stats.chunks} fragments)`}
          </Text>
        ) : (
          <Text color="gray.500">Off — the assistant uses keyword search only.</Text>
        )}
      </Box>
    </Stack>
  );
};

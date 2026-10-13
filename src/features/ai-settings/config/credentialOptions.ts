import type { CredentialType } from '@entities/ai-chat';

export const CREDENTIAL_OPTIONS: Record<
  CredentialType,
  { label: string; placeholder: string; help: string }
> = {
  'claude-oauth-token': {
    label: 'Claude subscription (Pro/Max)',
    placeholder: 'sk-ant-oat01-…',
    help: 'On any computer with Claude Code run `claude setup-token`, sign in with YOUR Claude account and paste the token. Uses your plan limits.',
  },
  'anthropic-api-key': {
    label: 'Anthropic API key',
    placeholder: 'sk-ant-api03-…',
    help: 'Create a key at console.anthropic.com → API keys. Billed per use to that Console account.',
  },
};

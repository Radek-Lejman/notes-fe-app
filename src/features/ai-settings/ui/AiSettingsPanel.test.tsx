import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiChatApi, type AiSettings } from '@entities/ai-chat';
import { renderWithProviders } from '@shared/lib/test/render';
import { AiSettingsPanel } from './AiSettingsPanel';

const VALID_SECRET = 'sk-ant-api03-0123456789abcdef';

const settings = (patch: Partial<AiSettings> = {}): AiSettings => ({
  provider: 'claude-agent-sdk',
  model: 'claude-sonnet',
  requiresAccount: true,
  credential: null,
  serverLoginAllowed: false,
  ready: false,
  rag: { enabled: false, embeddingModel: 'nomic-embed-text', stats: null },
  ...patch,
});

const renderPanel = (value: AiSettings) => {
  vi.spyOn(AiChatApi, 'getSettings').mockResolvedValue(value);
  return renderWithProviders(<AiSettingsPanel />);
};

const connected = settings({
  ready: true,
  credential: { type: 'anthropic-api-key', hint: '…abcd', updatedAt: '2026-10-01T10:00:00Z' },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AiSettingsPanel — status', () => {
  it('shows an error when the settings cannot be loaded', async () => {
    vi.spyOn(AiChatApi, 'getSettings').mockRejectedValue(new Error('offline'));
    renderWithProviders(<AiSettingsPanel />);

    expect(await screen.findByText('Could not load AI settings: offline')).toBeInTheDocument();
  });

  it('needs no account for a local model', async () => {
    renderPanel(settings({ requiresAccount: false, ready: true }));

    expect(await screen.findByText(/no account needed/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('asks to connect an account when there is none', async () => {
    renderPanel(settings());

    expect(await screen.findByText('Connect your Claude account')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Test connection' })).not.toBeInTheDocument();
  });

  it('says when the server login is used instead', async () => {
    renderPanel(settings({ serverLoginAllowed: true, ready: true }));

    expect(await screen.findByText("Using this server's Claude login")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test connection' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disconnect' })).not.toBeInTheDocument();
  });

  it('shows the connected account with its hint, never the secret', async () => {
    renderPanel(connected);

    expect(await screen.findByText('Your Claude account is connected')).toBeInTheDocument();
    expect(screen.getByText(/Anthropic API key …abcd/)).toBeInTheDocument();
    expect(screen.getByText('Replace with')).toBeInTheDocument();
  });

  it('shows the RAG index status', async () => {
    renderPanel(
      settings({
        rag: {
          enabled: true,
          embeddingModel: 'nomic-embed-text',
          stats: { totalNotes: 10, indexedNotes: 8, chunks: 42 },
        },
      }),
    );

    expect(
      await screen.findByText('On · nomic-embed-text · 8/10 notes indexed (42 fragments)'),
    ).toBeInTheDocument();
  });

  it('says when semantic search is off', async () => {
    renderPanel(settings());

    expect(await screen.findByText(/keyword search only/)).toBeInTheDocument();
  });
});

describe('AiSettingsPanel — actions', () => {
  it('enables Save only for a plausible secret', async () => {
    renderPanel(settings());
    const input = await screen.findByPlaceholderText('sk-ant-oat01-…');
    const save = screen.getByRole('button', { name: 'Save' });

    await userEvent.type(input, 'too-short');
    expect(save).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, VALID_SECRET);
    expect(save).toBeEnabled();
  });

  it('switches the help and placeholder with the account type', async () => {
    renderPanel(settings());

    await userEvent.selectOptions(await screen.findByRole('combobox'), 'anthropic-api-key');

    expect(screen.getByPlaceholderText('sk-ant-api03-…')).toBeInTheDocument();
    expect(screen.getByText(/console.anthropic.com/)).toBeInTheDocument();
  });

  it('saves the trimmed secret and then forgets it in the browser', async () => {
    const save = vi
      .spyOn(AiChatApi, 'saveCredential')
      .mockResolvedValue({ type: 'claude-oauth-token', hint: '…cdef', updatedAt: '' });
    renderPanel(settings());
    const input = await screen.findByPlaceholderText('sk-ant-oat01-…');

    await userEvent.type(input, `  ${VALID_SECRET}  `);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        { type: 'claude-oauth-token', secret: VALID_SECRET },
        expect.anything(),
      ),
    );
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('keeps the secret and shows the error when saving fails', async () => {
    vi.spyOn(AiChatApi, 'saveCredential').mockRejectedValue(new Error('Token rejected'));
    renderPanel(settings());
    const input = await screen.findByPlaceholderText('sk-ant-oat01-…');

    await userEvent.type(input, VALID_SECRET);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Token rejected')).toBeInTheDocument();
    expect(input).toHaveValue(VALID_SECRET);
  });

  it.each([
    [true, 'Connection works'],
    [false, 'Invalid token'],
  ])('shows the connection test result (ok=%s)', async (ok, message) => {
    vi.spyOn(AiChatApi, 'testCredential').mockResolvedValue({ ok, message });
    renderPanel(connected);

    await userEvent.click(await screen.findByRole('button', { name: 'Test connection' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('disconnects the account', async () => {
    const remove = vi.spyOn(AiChatApi, 'removeCredential').mockResolvedValue();
    renderPanel(connected);

    await userEvent.click(await screen.findByRole('button', { name: 'Disconnect' }));

    await waitFor(() => expect(remove).toHaveBeenCalledOnce());
  });
});

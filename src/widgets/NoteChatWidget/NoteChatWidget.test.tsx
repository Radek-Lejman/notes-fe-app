import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiChatApi, type AiSettings } from '@entities/ai-chat';
import { renderWithProviders } from '@shared/lib/test/render';
import { NoteChatWidget } from './ui/NoteChatWidget';

const settings = (ready: boolean): AiSettings => ({
  provider: 'claude',
  model: 'sonnet',
  requiresAccount: true,
  credential: null,
  serverLoginAllowed: false,
  ready,
  rag: { enabled: false, embeddingModel: '', stats: null },
});

const openDrawer = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Ask AI/ }));
  return screen.findByRole('dialog');
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NoteChatWidget', () => {
  it('opens on the chat when AI is ready', async () => {
    vi.spyOn(AiChatApi, 'getSettings').mockResolvedValue(settings(true));
    renderWithProviders(<NoteChatWidget noteId="n1" />);

    await openDrawer();

    expect(await screen.findByText('AI assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask AI…/)).toBeInTheDocument();
  });

  it('opens on the settings when no AI account is connected yet', async () => {
    vi.spyOn(AiChatApi, 'getSettings').mockResolvedValue(settings(false));
    renderWithProviders(<NoteChatWidget noteId="n1" />);

    await openDrawer();

    expect(await screen.findByText('AI settings')).toBeInTheDocument();
    expect(await screen.findByText('Connect your Claude account')).toBeInTheDocument();
  });

  it('switches between chat and settings', async () => {
    vi.spyOn(AiChatApi, 'getSettings').mockResolvedValue(settings(true));
    renderWithProviders(<NoteChatWidget noteId="n1" />);
    await openDrawer();
    await screen.findByText('AI assistant');

    await userEvent.click(screen.getByRole('button', { name: 'AI settings' }));
    expect(screen.getByText('AI settings', { selector: 'h2' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back to chat' }));
    expect(screen.getByText('AI assistant')).toBeInTheDocument();
  });
});

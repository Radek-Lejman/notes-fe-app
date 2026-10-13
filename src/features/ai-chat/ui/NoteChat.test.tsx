import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiChatApi, type ChatEvent } from '@entities/ai-chat';
import { renderWithProviders } from '@shared/lib/test/render';
import type { ChatMessage } from '../model/types';
import { ChatMessageItem } from './ChatMessageItem';
import { NoteChat } from './NoteChat';

const assistant = (patch: Partial<ChatMessage>): ChatMessage => ({
  id: 'a1',
  role: 'assistant',
  content: '',
  status: 'done',
  ...patch,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ChatMessageItem', () => {
  it('shows the user message as plain text', () => {
    renderWithProviders(
      <ChatMessageItem message={{ id: 'u', role: 'user', content: '**hi**', status: 'done' }} />,
    );
    expect(screen.getByText('**hi**')).toBeInTheDocument();
  });

  it('renders the answer as markdown and lets the user copy it', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { container } = renderWithProviders(
      <ChatMessageItem message={assistant({ content: 'Use **volumes**.' })} />,
    );

    await waitFor(() => expect(container.querySelector('strong')).toHaveTextContent('volumes'));
    await userEvent.click(screen.getByRole('button', { name: 'Copy answer' }));
    expect(writeText).toHaveBeenCalledWith('Use **volumes**.');
  });

  it('shows what the agent is doing while streaming', () => {
    renderWithProviders(
      <ChatMessageItem
        message={assistant({
          status: 'streaming',
          activity: { tool: 'search_notes', input: { query: 'docker' } },
        })}
      />,
    );
    expect(screen.getByText('Searching notes for "docker"…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy answer' })).not.toBeInTheDocument();
  });

  it('offers the AI settings for a credentials error', async () => {
    const onOpenSettings = vi.fn();
    renderWithProviders(
      <ChatMessageItem
        message={assistant({ status: 'error', error: 'No account', errorCode: 'credentials' })}
        onOpenSettings={onOpenSettings}
      />,
    );

    expect(screen.getByText('No account')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open AI settings' }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it('does not offer settings for other errors', () => {
    renderWithProviders(
      <ChatMessageItem message={assistant({ status: 'error' })} onOpenSettings={vi.fn()} />,
    );
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open AI settings' })).not.toBeInTheDocument();
  });

  it('marks a stopped answer', () => {
    renderWithProviders(<ChatMessageItem message={assistant({ status: 'aborted' })} />);
    expect(screen.getByText('Stopped.')).toBeInTheDocument();
  });

  it('links the source notes', () => {
    renderWithProviders(
      <ChatMessageItem
        message={assistant({
          content: 'x',
          sources: [
            { id: 'n1', title: 'Docker' },
            { id: 'n2', title: '' },
          ],
        })}
      />,
    );
    expect(screen.getByRole('link', { name: 'Docker' })).toHaveAttribute('href', '/note/n1');
    expect(screen.getByRole('link', { name: 'Untitled' })).toHaveAttribute('href', '/note/n2');
  });
});

describe('NoteChat', () => {
  const answerWith = (text: string) =>
    // eslint-disable-next-line @typescript-eslint/require-await -- a canned stream has nothing to wait for
    vi.spyOn(AiChatApi, 'streamChat').mockImplementation(async function* () {
      yield { type: 'done', text, turns: 1, durationMs: 1 } satisfies ChatEvent;
    });

  it('shows a hint before the first message', () => {
    renderWithProviders(<NoteChat noteId="n1" />);
    expect(screen.getByText(/Ask about this note/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear chat' })).toBeDisabled();
  });

  it('sends with Enter and clears the input', async () => {
    const stream = answerWith('Sure.');
    renderWithProviders(<NoteChat noteId="n1" />);
    const input = screen.getByPlaceholderText(/Ask AI/);

    await userEvent.type(input, 'Summarize{Enter}');

    await waitFor(() => expect(screen.getByText('Sure.')).toBeInTheDocument());
    expect(stream).toHaveBeenCalledOnce();
    expect(input).toHaveValue('');
  });

  it('adds a new line with Shift+Enter instead of sending', async () => {
    const stream = answerWith('x');
    renderWithProviders(<NoteChat noteId="n1" />);
    const input = screen.getByPlaceholderText(/Ask AI/);

    await userEvent.type(input, 'line 1{Shift>}{Enter}{/Shift}line 2');

    expect(input).toHaveValue('line 1\nline 2');
    expect(stream).not.toHaveBeenCalled();
  });

  it('sends with the button and clears the conversation', async () => {
    answerWith('Answer');
    renderWithProviders(<NoteChat noteId="n1" />);

    await userEvent.type(screen.getByPlaceholderText(/Ask AI/), 'Question');
    await userEvent.click(screen.getByRole('button', { name: /Send/ }));
    await waitFor(() => expect(screen.getByText('Answer')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Clear chat' }));
    expect(screen.queryByText('Question')).not.toBeInTheDocument();
    expect(screen.getByText(/Ask about this note/)).toBeInTheDocument();
  });

  it('shows Stop while streaming and stops the answer', async () => {
    vi.spyOn(AiChatApi, 'streamChat').mockImplementation(async function* (_payload, signal) {
      yield { type: 'text_delta', text: 'Thinking out loud' } satisfies ChatEvent;
      await new Promise((_, reject) =>
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted'))),
      );
    });
    renderWithProviders(<NoteChat noteId="n1" />);

    await userEvent.type(screen.getByPlaceholderText(/Ask AI/), 'Question{Enter}');
    await userEvent.click(await screen.findByRole('button', { name: /Stop/ }));

    expect(await screen.findByText('Stopped.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send/ })).toBeInTheDocument();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AiChatApi, type ChatEvent, type ChatRequest } from '@entities/ai-chat';
import { ApiError } from '@shared/api';
import { chatStorage } from '../lib/chatStorage';
import type { ChatMessage } from './types';
import { useNoteChat } from './useNoteChat';

type StreamChat = typeof AiChatApi.streamChat;

/** A stream that yields the events and ends. */
const streamOf = (...events: ChatEvent[]): StreamChat =>
  // eslint-disable-next-line @typescript-eslint/require-await -- a canned stream has nothing to wait for
  async function* () {
    for (const event of events) yield event;
  };

/** A stream that stays open until aborted, then fails like fetch does. */
const hangingStream: StreamChat = async function* (_payload, signal) {
  yield { type: 'text_delta', text: 'Partial' };
  await new Promise((_, reject) =>
    signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
  );
};

const done = (text: string): ChatEvent => ({ type: 'done', text, turns: 1, durationMs: 1 });
const stored = (patch: Partial<ChatMessage>): ChatMessage => ({
  id: crypto.randomUUID(),
  role: 'user',
  content: 'Earlier question',
  status: 'done',
  ...patch,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useNoteChat', () => {
  it('starts with the history saved for the note', () => {
    chatStorage.save('n1', [stored({})]);

    const { result } = renderHook(() => useNoteChat('n1'));

    expect(result.current.messages.map((m) => m.content)).toEqual(['Earlier question']);
    expect(result.current.isStreaming).toBe(false);
  });

  it('sends the question with the note id and shows the streamed answer', async () => {
    const stream = vi
      .spyOn(AiChatApi, 'streamChat')
      .mockImplementation(streamOf({ type: 'text_delta', text: 'Hi' }, done('Hi there')));
    const { result } = renderHook(() => useNoteChat('n1'));

    await act(() => result.current.send('  Hello  '));

    const [request] = stream.mock.calls[0] as [ChatRequest, AbortSignal];
    expect(request).toEqual({ messages: [{ role: 'user', content: 'Hello' }], noteId: 'n1' });
    expect(result.current.messages).toMatchObject([
      { role: 'user', content: 'Hello', status: 'done' },
      { role: 'assistant', content: 'Hi there', status: 'done' },
    ]);
  });

  it('includes earlier completed turns in the request', async () => {
    chatStorage.save('n1', [
      stored({ content: 'Q1' }),
      stored({ role: 'assistant', content: 'A1' }),
      stored({ role: 'assistant', content: 'failed', status: 'error' }),
    ]);
    const stream = vi.spyOn(AiChatApi, 'streamChat').mockImplementation(streamOf(done('A2')));
    const { result } = renderHook(() => useNoteChat('n1'));

    await act(() => result.current.send('Q2'));

    const [request] = stream.mock.calls[0] as [ChatRequest, AbortSignal];
    expect(request.messages.map((m) => m.content)).toEqual(['Q1', 'A1', 'Q2']);
  });

  it('ignores empty messages', async () => {
    const stream = vi.spyOn(AiChatApi, 'streamChat');
    const { result } = renderHook(() => useNoteChat('n1'));

    await act(() => result.current.send('   '));

    expect(stream).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it('saves the finished conversation for the note', async () => {
    vi.spyOn(AiChatApi, 'streamChat').mockImplementation(streamOf(done('Answer')));
    const { result } = renderHook(() => useNoteChat('n1'));

    await act(() => result.current.send('Question'));

    expect(chatStorage.load('n1').map((m) => m.content)).toEqual(['Question', 'Answer']);
  });

  it('reports a stream that ends without a final event', async () => {
    vi.spyOn(AiChatApi, 'streamChat').mockImplementation(
      streamOf({ type: 'text_delta', text: 'Half' }),
    );
    const { result } = renderHook(() => useNoteChat('n1'));

    await act(() => result.current.send('Question'));

    expect(result.current.messages[1]).toMatchObject({
      status: 'error',
      error: 'The connection was closed too early.',
    });
  });

  it('shows an error event from the server', async () => {
    vi.spyOn(AiChatApi, 'streamChat').mockImplementation(
      streamOf({ type: 'error', message: 'Model overloaded' }),
    );
    const { result } = renderHook(() => useNoteChat('n1'));

    await act(() => result.current.send('Question'));

    expect(result.current.messages[1]).toMatchObject({
      status: 'error',
      error: 'Model overloaded',
    });
  });

  it('marks a missing AI account so the UI can offer the settings', async () => {
    vi.spyOn(AiChatApi, 'streamChat').mockImplementation(
      // eslint-disable-next-line require-yield, @typescript-eslint/require-await -- fails before the first event, like a 403 does
      async function* () {
        throw new ApiError(403, 'Connect your Claude account', {
          code: 'AI_CREDENTIALS_REQUIRED',
        });
      },
    );
    const { result } = renderHook(() => useNoteChat('n1'));

    await act(() => result.current.send('Question'));

    expect(result.current.messages[1]).toMatchObject({
      status: 'error',
      error: 'Connect your Claude account',
      errorCode: 'credentials',
    });
  });

  it('stops a running answer and keeps what was streamed', async () => {
    vi.spyOn(AiChatApi, 'streamChat').mockImplementation(hangingStream);
    const { result } = renderHook(() => useNoteChat('n1'));

    let sending!: Promise<void>;
    act(() => {
      sending = result.current.send('Question');
    });
    await waitFor(() => expect(result.current.messages[1]?.content).toBe('Partial'));
    expect(result.current.isStreaming).toBe(true);

    await act(async () => {
      result.current.stop();
      await sending;
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.messages[1]).toMatchObject({ status: 'aborted', content: 'Partial' });
  });

  it('does not start a second answer while one is streaming', async () => {
    const stream = vi.spyOn(AiChatApi, 'streamChat').mockImplementation(hangingStream);
    const { result } = renderHook(() => useNoteChat('n1'));

    act(() => {
      void result.current.send('First');
    });
    await waitFor(() => expect(result.current.isStreaming).toBe(true));
    await act(() => result.current.send('Second'));

    expect(stream).toHaveBeenCalledOnce();
    act(() => result.current.stop());
  });

  it('clears the conversation and its saved history', async () => {
    vi.spyOn(AiChatApi, 'streamChat').mockImplementation(streamOf(done('Answer')));
    const { result } = renderHook(() => useNoteChat('n1'));
    await act(() => result.current.send('Question'));

    act(() => result.current.clear());

    expect(result.current.messages).toEqual([]);
    expect(chatStorage.load('n1')).toEqual([]);
  });

  it('aborts the running request when unmounted', async () => {
    let signal: AbortSignal | undefined;
    vi.spyOn(AiChatApi, 'streamChat').mockImplementation((payload, s) => {
      signal = s;
      return hangingStream(payload, s);
    });
    const { result, unmount } = renderHook(() => useNoteChat('n1'));
    act(() => {
      void result.current.send('Question');
    });
    await waitFor(() => expect(signal).toBeDefined());

    unmount();

    expect(signal?.aborted).toBe(true);
  });
});

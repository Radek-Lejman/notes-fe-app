import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AxiosResponse } from 'axios';
import { act, waitFor } from '@testing-library/react';
import { apiClient } from '@shared/api/axios/client';
import { ApiError } from '@shared/api';
import { renderHookWithProviders } from '@shared/lib/test/render';
import type { ChatEvent } from '../model/types';
import { AiChatApi } from './aiChatApi';
import { aiKeys } from './aiKeys';
import { useRemoveAiCredential, useSaveAiCredential } from './hooks/useAiSettings';

const ok = <T>(data: T) => Promise.resolve({ data } as AxiosResponse<T>);

const streamOf = (text: string) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });

const collect = async (events: AsyncGenerator<ChatEvent>) => {
  const all: ChatEvent[] = [];
  for await (const event of events) all.push(event);
  return all;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AiChatApi.streamChat', () => {
  const payload = { messages: [{ role: 'user' as const, content: 'Hi' }], noteId: 'n1' };

  it('yields the parsed SSE events', async () => {
    vi.spyOn(apiClient, 'post').mockReturnValue(
      ok(
        streamOf(
          'event: text_delta\ndata: {"type":"text_delta","text":"Hel"}\n\n' +
            'event: done\ndata: {"type":"done","text":"Hello","turns":1,"durationMs":5}\n\n',
        ),
      ),
    );

    await expect(collect(AiChatApi.streamChat(payload))).resolves.toEqual([
      { type: 'text_delta', text: 'Hel' },
      { type: 'done', text: 'Hello', turns: 1, durationMs: 5 },
    ]);
  });

  it('requests a stream through apiClient, so CSRF and token refresh apply', async () => {
    const post = vi.spyOn(apiClient, 'post').mockReturnValue(ok(streamOf('')));
    const signal = new AbortController().signal;

    await collect(AiChatApi.streamChat(payload, signal));

    expect(post).toHaveBeenCalledWith(
      '/ai/chat',
      payload,
      expect.objectContaining({
        adapter: 'fetch',
        responseType: 'stream',
        signal,
        headers: { Accept: 'text/event-stream' },
      }),
    );
  });

  it('reads the JSON error body that arrives as a stream', async () => {
    const body = { message: 'Connect your Claude account', code: 'AI_CREDENTIALS_REQUIRED' };
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      new ApiError(403, 'Request failed', streamOf(JSON.stringify(body))),
    );

    const error = await collect(AiChatApi.streamChat(payload)).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 403, message: body.message, details: body });
  });

  it('joins validation messages', async () => {
    const body = { message: ['messages must not be empty', 'noteId must be a UUID'] };
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      new ApiError(400, 'Request failed', streamOf(JSON.stringify(body))),
    );

    await expect(collect(AiChatApi.streamChat(payload))).rejects.toMatchObject({
      message: 'messages must not be empty, noteId must be a UUID',
    });
  });

  it('keeps the original error when the streamed body is not JSON', async () => {
    const original = new ApiError(502, 'Bad gateway', streamOf('<html>proxy error</html>'));
    vi.spyOn(apiClient, 'post').mockRejectedValue(original);

    await expect(collect(AiChatApi.streamChat(payload))).rejects.toBe(original);
  });

  it('passes other errors through', async () => {
    const original = new Error('Network Error');
    vi.spyOn(apiClient, 'post').mockRejectedValue(original);

    await expect(collect(AiChatApi.streamChat(payload))).rejects.toBe(original);
  });
});

describe('AiChatApi — requests', () => {
  it('assist posts the request with the abort signal and a long timeout', async () => {
    const answer = { text: 'Better text', provider: 'claude', durationMs: 10 };
    const post = vi.spyOn(apiClient, 'post').mockReturnValue(ok(answer));
    const signal = new AbortController().signal;

    await expect(AiChatApi.assist({ action: 'improve', text: 'txt' }, signal)).resolves.toEqual(
      answer,
    );
    expect(post).toHaveBeenCalledWith(
      '/ai/assist',
      { action: 'improve', text: 'txt' },
      { timeout: 120_000, signal },
    );
  });

  it('gets the settings', async () => {
    const get = vi.spyOn(apiClient, 'get').mockReturnValue(ok({ ready: true }));

    await expect(AiChatApi.getSettings()).resolves.toEqual({ ready: true });
    expect(get).toHaveBeenCalledWith('/ai/settings');
  });

  it('saves, removes and tests the credential', async () => {
    const put = vi.spyOn(apiClient, 'put').mockReturnValue(ok({ hint: '…abcd' }));
    const del = vi.spyOn(apiClient, 'delete').mockReturnValue(ok(undefined));
    const post = vi.spyOn(apiClient, 'post').mockReturnValue(ok({ ok: true, message: 'Works' }));
    const payload = { type: 'anthropic-api-key' as const, secret: 'sk-ant-api03-xxxxxxxx' };

    await AiChatApi.saveCredential(payload);
    await AiChatApi.removeCredential();
    await expect(AiChatApi.testCredential()).resolves.toEqual({ ok: true, message: 'Works' });

    expect(put).toHaveBeenCalledWith('/ai/credentials', payload);
    expect(del).toHaveBeenCalledWith('/ai/credentials');
    expect(post).toHaveBeenCalledWith('/ai/credentials/test', null, { timeout: 90_000 });
  });
});

describe('AI settings mutations', () => {
  it('refetch the settings after saving a credential', async () => {
    vi.spyOn(AiChatApi, 'saveCredential').mockResolvedValue({
      type: 'anthropic-api-key',
      hint: '…abcd',
      updatedAt: '',
    });
    const { result, queryClient } = renderHookWithProviders(() => useSaveAiCredential());
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    act(() => result.current.mutate({ type: 'anthropic-api-key', secret: 's' }));

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: aiKeys.settings() }));
  });

  it('refetch the settings after removing a credential', async () => {
    vi.spyOn(AiChatApi, 'removeCredential').mockResolvedValue();
    const { result, queryClient } = renderHookWithProviders(() => useRemoveAiCredential());
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    act(() => result.current.mutate());

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: aiKeys.settings() }));
  });
});

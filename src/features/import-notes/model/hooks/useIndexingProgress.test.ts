import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { AiChatApi, type AiSettings } from '@entities/ai-chat';
import { renderHookWithProviders } from '@shared/lib/test/render';
import {
  INDEXING_POLL_MS,
  INDEXING_STALL_MS,
  INDEXING_STALLED_POLL_MS,
} from '../../config/indexingPolling';
import { useIndexingProgress } from './useIndexingProgress';

const settings = (stats: AiSettings['rag']['stats'], enabled = true): AiSettings => ({
  provider: 'ollama',
  model: 'llama',
  requiresAccount: false,
  credential: null,
  serverLoginAllowed: false,
  ready: true,
  rag: { enabled, embeddingModel: 'nomic', stats },
});
const stats = (indexedNotes: number, totalNotes = 10) => ({ indexedNotes, totalNotes, chunks: 0 });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useIndexingProgress', () => {
  it.each([
    ['disabled', settings(null, false)],
    ['done', settings(stats(10))],
  ])('reports %s without polling', async (status, value) => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const get = vi.spyOn(AiChatApi, 'getSettings').mockResolvedValue(value);
    const { result } = renderHookWithProviders(() => useIndexingProgress());

    await waitFor(() => expect(result.current.status).toBe(status));
    await act(() => vi.advanceTimersByTimeAsync(INDEXING_POLL_MS * 3));
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('polls while the notes are indexed and stops when it is done', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const get = vi
      .spyOn(AiChatApi, 'getSettings')
      .mockResolvedValueOnce(settings(stats(2)))
      .mockResolvedValue(settings(stats(10)));
    const { result } = renderHookWithProviders(() => useIndexingProgress());

    await waitFor(() =>
      expect(result.current).toEqual({ status: 'indexing', indexedNotes: 2, totalNotes: 10 }),
    );
    await act(() => vi.advanceTimersByTimeAsync(INDEXING_POLL_MS));
    await waitFor(() => expect(result.current.status).toBe('done'));
    await act(() => vi.advanceTimersByTimeAsync(INDEXING_POLL_MS * 3));
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('polls slower when nothing moved for a while and recovers when it moves', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const get = vi.spyOn(AiChatApi, 'getSettings').mockResolvedValue(settings(stats(3)));
    const { result } = renderHookWithProviders(() => useIndexingProgress());

    await waitFor(() => expect(result.current.status).toBe('indexing'));
    for (let poll = 0; poll < INDEXING_STALL_MS / INDEXING_POLL_MS; poll++) {
      await act(() => vi.advanceTimersByTimeAsync(INDEXING_POLL_MS));
    }
    await waitFor(() => expect(result.current.status).toBe('stalled'));

    const calls = get.mock.calls.length;
    await act(() => vi.advanceTimersByTimeAsync(INDEXING_STALLED_POLL_MS - INDEXING_POLL_MS));
    expect(get).toHaveBeenCalledTimes(calls);

    get.mockResolvedValue(settings(stats(7)));
    await act(() => vi.advanceTimersByTimeAsync(INDEXING_POLL_MS));
    await waitFor(() =>
      expect(result.current).toEqual({ status: 'indexing', indexedNotes: 7, totalNotes: 10 }),
    );
  });
});

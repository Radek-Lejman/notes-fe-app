import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@shared/api';
import { CHAT_STORAGE_PREFIX } from '../config/constants';
import type { ChatMessage } from '../model/types';
import { chatStorage } from './chatStorage';
import { toChatError } from './toChatError';
import { toolActivityLabel } from './toolActivityLabel';

const message = (patch: Partial<ChatMessage>): ChatMessage => ({
  id: 'm1',
  role: 'assistant',
  content: 'Answer',
  status: 'done',
  ...patch,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('chatStorage', () => {
  it('saves and loads the history per note', () => {
    chatStorage.save('n1', [message({ id: 'a' })]);
    chatStorage.save('n2', [message({ id: 'b' })]);

    expect(chatStorage.load('n1').map((m) => m.id)).toEqual(['a']);
    expect(chatStorage.load('n2').map((m) => m.id)).toEqual(['b']);
  });

  it('returns an empty history for an unknown note', () => {
    expect(chatStorage.load('missing')).toEqual([]);
  });

  it('marks an answer that was streaming before a reload as stopped', () => {
    chatStorage.save('n1', [
      message({ status: 'streaming', activity: { tool: 'search_notes', input: {} } }),
    ]);

    expect(chatStorage.load('n1')[0]).toMatchObject({ status: 'aborted', activity: undefined });
  });

  it('removes the entry when the history is cleared', () => {
    chatStorage.save('n1', [message({})]);
    chatStorage.save('n1', []);

    expect(sessionStorage.getItem(CHAT_STORAGE_PREFIX + 'n1')).toBeNull();
  });

  it('ignores corrupted data', () => {
    sessionStorage.setItem(CHAT_STORAGE_PREFIX + 'n1', '{not json');

    expect(chatStorage.load('n1')).toEqual([]);
  });

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(chatStorage.load('n1')).toEqual([]);
    expect(() => chatStorage.save('n1', [message({})])).not.toThrow();
  });
});

describe('toolActivityLabel', () => {
  it.each([
    [{ tool: 'search_notes', input: { query: 'docker' } }, 'Searching notes for "docker"…'],
    [{ tool: 'search_notes', input: { query: 42 } }, 'Searching notes…'],
    [{ tool: 'search_notes', input: null }, 'Searching notes…'],
    [{ tool: 'get_note', input: { id: 'n1' } }, 'Reading a note…'],
    [{ tool: 'list_notes', input: {} }, 'Looking through your notes…'],
    [{ tool: 'unknown_tool', input: {} }, 'Working…'],
  ])('describes %j', (activity, label) => {
    expect(toolActivityLabel(activity)).toBe(label);
  });
});

describe('toChatError — branches not covered elsewhere', () => {
  it('treats an invalid credential as a settings problem', () => {
    const error = new ApiError(401, 'Token rejected', { code: 'AI_CREDENTIALS_INVALID' });
    expect(toChatError(error).errorCode).toBe('credentials');
  });

  it('treats any 403 as a settings problem, even without a code', () => {
    expect(toChatError(new ApiError(403, 'Forbidden')).errorCode).toBe('credentials');
  });

  it('gives a 429 without a message a readable one', () => {
    expect(toChatError(new ApiError(429, ''))).toEqual({
      error: 'Too many AI requests — wait a moment.',
      errorCode: 'busy',
    });
  });

  it('handles non-Error values', () => {
    expect(toChatError('stream closed')).toEqual({ error: 'stream closed' });
  });
});

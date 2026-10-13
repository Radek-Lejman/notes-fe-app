import { describe, expect, it } from 'vitest';
import { ApiError } from '@shared/api';
import { toChatError } from './toChatError';

describe('toChatError', () => {
  it('asks for AI settings when the account is missing', () => {
    const error = new ApiError(403, 'Connect your Claude account', {
      code: 'AI_CREDENTIALS_REQUIRED',
    });
    expect(toChatError(error)).toEqual({
      error: 'Connect your Claude account',
      errorCode: 'credentials',
    });
  });

  it('marks rate limits and busy runs', () => {
    expect(toChatError(new ApiError(429, 'busy', { code: 'AI_BUSY' })).errorCode).toBe('busy');
  });

  it('passes other errors through', () => {
    expect(toChatError(new ApiError(404, 'Note not found'))).toEqual({ error: 'Note not found' });
    expect(toChatError(new Error('offline'))).toEqual({ error: 'offline' });
  });
});

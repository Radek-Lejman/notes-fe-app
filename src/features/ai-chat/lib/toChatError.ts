import { ApiError } from '@shared/api';
import { normalizeError } from '@shared/lib/error';
import { AI_ERROR_CODES } from '@entities/ai-chat';
import type { ChatErrorCode } from '../model/types';

const codeOf = (details: unknown): unknown =>
  typeof details === 'object' && details !== null
    ? (details as Record<string, unknown>).code
    : undefined;

/** Message + actionable code for a failed chat request. */
export function toChatError(error: unknown): { error: string; errorCode?: ChatErrorCode } {
  const { message } = normalizeError(error);
  if (!(error instanceof ApiError)) return { error: message };

  const code = codeOf(error.details);
  if (
    code === AI_ERROR_CODES.credentialsRequired ||
    code === AI_ERROR_CODES.credentialsInvalid ||
    error.status === 403
  ) {
    return { error: message, errorCode: 'credentials' };
  }
  if (error.status === 429) {
    return { error: message || 'Too many AI requests — wait a moment.', errorCode: 'busy' };
  }
  return { error: message };
}

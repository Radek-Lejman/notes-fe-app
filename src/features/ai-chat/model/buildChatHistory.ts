import type { ChatTurn } from '@entities/ai-chat';
import { MAX_CHAT_HISTORY, MAX_CHAT_MESSAGE_LENGTH } from '../config/constants';
import type { ChatMessage } from './types';

const TRUNCATED = '\n\n[…truncated]';

/** BE rejects longer messages, so a long earlier answer must not break the whole chat. */
const clip = (content: string) =>
  content.length <= MAX_CHAT_MESSAGE_LENGTH
    ? content
    : content.slice(0, MAX_CHAT_MESSAGE_LENGTH - TRUNCATED.length) + TRUNCATED;

/** Completed turns of the conversation + the new user message, capped to what BE accepts. */
export function buildChatHistory(messages: ChatMessage[], newMessage: string): ChatTurn[] {
  const history = messages
    .filter((m) => m.status === 'done' && m.content.trim())
    .map(({ role, content }) => ({ role, content: clip(content) }));

  return [...history, { role: 'user' as const, content: clip(newMessage) }].slice(
    -MAX_CHAT_HISTORY,
  );
}

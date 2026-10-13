import type { ChatRole, ChatSource } from '@entities/ai-chat';

export type ChatMessageStatus = 'streaming' | 'done' | 'error' | 'aborted';

export interface ChatActivity {
  tool: string;
  input: unknown;
}

/** Errors the UI can act on: open AI settings, or wait. */
export type ChatErrorCode = 'credentials' | 'busy';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** Final text, or the text streamed so far. */
  content: string;
  status: ChatMessageStatus;
  sources?: ChatSource[];
  /** Tool the agent is running right now (only while streaming). */
  activity?: ChatActivity;
  error?: string;
  errorCode?: ChatErrorCode;
}

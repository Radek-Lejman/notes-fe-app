/** Mirrors ChatEvent in notes-app-be/src/modules/ai/types/chat.types.ts. */
export interface ChatSource {
  id: string;
  title: string;
}

export type ChatEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'text'; text: string }
  | { type: 'tool_call'; tool: string; input: unknown }
  | { type: 'tool_result'; tool: string; isError: boolean }
  | { type: 'sources'; notes: ChatSource[] }
  | { type: 'done'; text: string; turns: number; durationMs: number }
  | { type: 'error'; message: string };

export type ChatRole = 'user' | 'assistant';

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatTurn[];
  noteId?: string;
}

// --- AI settings (mirrors AiSettingsController in notes-app-be) ---

export type CredentialType = 'claude-oauth-token' | 'anthropic-api-key';

export interface CredentialStatus {
  type: CredentialType;
  hint: string;
  updatedAt: string;
}

export interface AiSettings {
  provider: string;
  model: string;
  requiresAccount: boolean;
  credential: CredentialStatus | null;
  serverLoginAllowed: boolean;
  ready: boolean;
  rag: {
    enabled: boolean;
    embeddingModel: string;
    stats: { totalNotes: number; indexedNotes: number; chunks: number } | null;
  };
}

export interface SaveCredentialPayload {
  type: CredentialType;
  secret: string;
}

export interface CredentialTestResult {
  ok: boolean;
  message: string;
}

/** `code` of AI error responses (403/429). */
export const AI_ERROR_CODES = {
  credentialsRequired: 'AI_CREDENTIALS_REQUIRED',
  credentialsInvalid: 'AI_CREDENTIALS_INVALID',
  busy: 'AI_BUSY',
} as const;

export type AssistAction =
  | 'explain'
  | 'summarize'
  | 'improve'
  | 'fix'
  | 'translate'
  | 'continue'
  | 'custom';

/** Ask AI in the editor: one action on the selected text (or new text at the cursor). */
export interface AssistRequest {
  action: AssistAction;
  text?: string;
  /** Required for `custom`. */
  instruction?: string;
}

export interface AssistResponse {
  /** Markdown to insert into the note. */
  text: string;
  provider: string;
  model?: string;
  durationMs: number;
}

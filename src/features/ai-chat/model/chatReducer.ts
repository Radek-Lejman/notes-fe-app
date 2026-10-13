import type { ChatEvent } from '@entities/ai-chat';
import type { ChatErrorCode, ChatMessage } from './types';

export interface ChatState {
  messages: ChatMessage[];
  /** Text blocks completed during the current answer; the draft is the block being streamed. */
  blocks: string[];
  draft: string;
}

export type ChatAction =
  | { type: 'send'; userMessage: ChatMessage; assistantMessage: ChatMessage }
  | { type: 'event'; event: ChatEvent }
  | { type: 'fail'; error: string; errorCode?: ChatErrorCode }
  | { type: 'abort' }
  | { type: 'clear' };

export const initialChatState = (messages: ChatMessage[] = []): ChatState => ({
  messages,
  blocks: [],
  draft: '',
});

const joinBlocks = (blocks: string[], draft = '') =>
  [...blocks, draft].filter((part) => part.trim()).join('\n\n');

/** Applies a patch to the last (assistant) message while it is streaming. */
const updateStreaming = (state: ChatState, patch: (m: ChatMessage) => Partial<ChatMessage>) => {
  const last = state.messages.at(-1);
  if (!last || last.status !== 'streaming') return state.messages;
  return [...state.messages.slice(0, -1), { ...last, ...patch(last) }];
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'send':
      return {
        messages: [...state.messages, action.userMessage, action.assistantMessage],
        blocks: [],
        draft: '',
      };

    case 'event':
      return applyEvent(state, action.event);

    case 'fail':
      return {
        ...state,
        messages: updateStreaming(state, () => ({
          status: 'error',
          error: action.error,
          errorCode: action.errorCode,
          activity: undefined,
        })),
      };

    case 'abort':
      return {
        ...state,
        messages: updateStreaming(state, () => ({ status: 'aborted', activity: undefined })),
      };

    case 'clear':
      return initialChatState();
  }
}

function applyEvent(state: ChatState, event: ChatEvent): ChatState {
  switch (event.type) {
    case 'text_delta': {
      const draft = state.draft + event.text;
      return {
        ...state,
        draft,
        messages: updateStreaming(state, () => ({
          content: joinBlocks(state.blocks, draft),
          activity: undefined,
        })),
      };
    }

    case 'text': {
      // A complete block; replaces its streamed draft (providers without deltas send only this).
      const blocks = [...state.blocks, event.text];
      return {
        ...state,
        blocks,
        draft: '',
        messages: updateStreaming(state, () => ({ content: joinBlocks(blocks) })),
      };
    }

    case 'tool_call':
      return {
        ...state,
        messages: updateStreaming(state, () => ({
          activity: { tool: event.tool, input: event.input },
        })),
      };

    case 'tool_result':
      return state;

    case 'sources':
      return { ...state, messages: updateStreaming(state, () => ({ sources: event.notes })) };

    case 'done':
      return {
        ...state,
        messages: updateStreaming(state, (m) => ({
          // The final answer only — preambles like "Let me search..." are dropped.
          content: event.text || m.content,
          status: 'done',
          activity: undefined,
        })),
      };

    case 'error':
      return chatReducer(state, { type: 'fail', error: event.message });
  }
}

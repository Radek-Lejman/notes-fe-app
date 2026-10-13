import { useCallback, useEffect, useReducer, useRef } from 'react';
import { AiChatApi } from '@entities/ai-chat';
import { chatStorage } from '../lib/chatStorage';
import { toChatError } from '../lib/toChatError';
import { buildChatHistory } from './buildChatHistory';
import { chatReducer, initialChatState } from './chatReducer';
import type { ChatMessage } from './types';

const newMessage = (role: ChatMessage['role'], content: string, status: ChatMessage['status']) => ({
  id: crypto.randomUUID(),
  role,
  content,
  status,
});

/** Chat with the AI agent about a note (and all other notes of the user). */
export function useNoteChat(noteId: string) {
  const [state, dispatch] = useReducer(chatReducer, noteId, (id) =>
    initialChatState(chatStorage.load(id)),
  );
  const abortRef = useRef<AbortController | null>(null);
  const isStreaming = state.messages.at(-1)?.status === 'streaming';

  useEffect(() => {
    if (!isStreaming) chatStorage.save(noteId, state.messages);
  }, [noteId, state.messages, isStreaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || abortRef.current) return;

      const messages = buildChatHistory(state.messages, content);
      dispatch({
        type: 'send',
        userMessage: newMessage('user', content, 'done'),
        assistantMessage: newMessage('assistant', '', 'streaming'),
      });

      const abort = new AbortController();
      abortRef.current = abort;
      let finished = false;

      try {
        for await (const event of AiChatApi.streamChat({ messages, noteId }, abort.signal)) {
          dispatch({ type: 'event', event });
          if (event.type === 'done' || event.type === 'error') finished = true;
        }
        if (!finished) dispatch({ type: 'fail', error: 'The connection was closed too early.' });
      } catch (e) {
        if (abort.signal.aborted) dispatch({ type: 'abort' });
        else dispatch({ type: 'fail', ...toChatError(e) });
      } finally {
        abortRef.current = null;
      }
    },
    [noteId, state.messages],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: 'clear' });
  }, []);

  return { messages: state.messages, isStreaming, send, stop, clear };
}

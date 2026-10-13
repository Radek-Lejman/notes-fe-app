import { CHAT_STORAGE_PREFIX } from '../config/constants';
import type { ChatMessage } from '../model/types';

// Per-tab history; storage can be unavailable (private mode, blocked site data).
export const chatStorage = {
  load(noteId: string): ChatMessage[] {
    try {
      const raw = sessionStorage.getItem(CHAT_STORAGE_PREFIX + noteId);
      const messages = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
      // A reload interrupts the stream that was running.
      return messages.map((m) =>
        m.status === 'streaming' ? { ...m, status: 'aborted', activity: undefined } : m,
      );
    } catch {
      return [];
    }
  },

  save(noteId: string, messages: ChatMessage[]) {
    try {
      if (messages.length) {
        sessionStorage.setItem(CHAT_STORAGE_PREFIX + noteId, JSON.stringify(messages));
      } else {
        sessionStorage.removeItem(CHAT_STORAGE_PREFIX + noteId);
      }
    } catch {
      // History is a convenience — ignore storage failures.
    }
  },
};

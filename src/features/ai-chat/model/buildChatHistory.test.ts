import { describe, expect, it } from 'vitest';
import { MAX_CHAT_HISTORY, MAX_CHAT_MESSAGE_LENGTH } from '../config/constants';
import { buildChatHistory } from './buildChatHistory';
import type { ChatMessage } from './types';

const msg = (
  role: ChatMessage['role'],
  content: string,
  status: ChatMessage['status'] = 'done',
): ChatMessage => ({ id: content, role, content, status });

describe('buildChatHistory', () => {
  it('sends completed turns followed by the new message', () => {
    expect(buildChatHistory([msg('user', 'Q1'), msg('assistant', 'A1')], 'Q2')).toEqual([
      { role: 'user', content: 'Q1' },
      { role: 'assistant', content: 'A1' },
      { role: 'user', content: 'Q2' },
    ]);
  });

  it('skips failed, aborted and empty answers', () => {
    const messages = [
      msg('user', 'Q1'),
      msg('assistant', 'oops', 'error'),
      msg('user', 'Q2'),
      msg('assistant', 'half', 'aborted'),
      msg('assistant', ' '),
    ];
    expect(buildChatHistory(messages, 'Q3').map((t) => t.content)).toEqual(['Q1', 'Q2', 'Q3']);
  });

  it(`keeps at most ${MAX_CHAT_HISTORY} turns, always including the new message`, () => {
    const messages = Array.from({ length: MAX_CHAT_HISTORY + 5 }, (_, i) => msg('user', `Q${i}`));
    const history = buildChatHistory(messages, 'new');
    expect(history).toHaveLength(MAX_CHAT_HISTORY);
    expect(history.at(-1)).toEqual({ role: 'user', content: 'new' });
  });

  it('truncates a long earlier answer to the length the backend accepts', () => {
    const long = 'x'.repeat(MAX_CHAT_MESSAGE_LENGTH + 500);
    const [first, second] = buildChatHistory(
      [msg('user', 'Q1'), msg('assistant', long)],
      'Q2',
    ).slice(1);

    expect(first.content).toHaveLength(MAX_CHAT_MESSAGE_LENGTH);
    expect(first.content.endsWith('[…truncated]')).toBe(true);
    expect(second).toEqual({ role: 'user', content: 'Q2' });
  });
});

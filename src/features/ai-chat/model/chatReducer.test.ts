import { describe, expect, it } from 'vitest';
import type { ChatEvent } from '@entities/ai-chat';
import { chatReducer, initialChatState, type ChatState } from './chatReducer';
import type { ChatMessage } from './types';

const user: ChatMessage = { id: 'u1', role: 'user', content: 'Q', status: 'done' };
const assistant: ChatMessage = { id: 'a1', role: 'assistant', content: '', status: 'streaming' };

const started = () =>
  chatReducer(initialChatState(), { type: 'send', userMessage: user, assistantMessage: assistant });

const apply = (state: ChatState, ...events: ChatEvent[]) =>
  events.reduce((s, event) => chatReducer(s, { type: 'event', event }), state);

const answer = (state: ChatState) => state.messages.at(-1)!;

describe('chatReducer', () => {
  it('appends the user message and a streaming assistant message', () => {
    expect(started().messages).toEqual([user, assistant]);
  });

  it('builds the answer from deltas, replacing a draft with its complete block', () => {
    let state = apply(started(), { type: 'text_delta', text: 'Let me ' });
    expect(answer(state).content).toBe('Let me ');

    state = apply(
      state,
      { type: 'text_delta', text: 'check.' },
      { type: 'text', text: 'Let me check.' },
      { type: 'text_delta', text: 'Done' },
    );
    expect(answer(state).content).toBe('Let me check.\n\nDone');
  });

  it('works with providers that send only complete blocks', () => {
    const state = apply(started(), { type: 'text', text: 'A' }, { type: 'text', text: 'B' });
    expect(answer(state).content).toBe('A\n\nB');
  });

  it('shows the running tool until text arrives or the answer is done', () => {
    let state = apply(started(), {
      type: 'tool_call',
      tool: 'search_notes',
      input: { query: 'x' },
    });
    expect(answer(state).activity).toEqual({ tool: 'search_notes', input: { query: 'x' } });

    state = apply(state, { type: 'tool_result', tool: 'search_notes', isError: false });
    expect(answer(state).activity).toBeDefined();

    state = apply(state, { type: 'done', text: 'Final', turns: 2, durationMs: 1 });
    expect(answer(state).activity).toBeUndefined();
  });

  it('finishes with the final text and the sources', () => {
    const state = apply(
      started(),
      { type: 'text', text: 'Searching…' },
      { type: 'sources', notes: [{ id: 'n1', title: 'TS' }] },
      { type: 'done', text: 'Final', turns: 2, durationMs: 1 },
    );

    expect(answer(state)).toMatchObject({
      content: 'Final',
      status: 'done',
      sources: [{ id: 'n1', title: 'TS' }],
    });
  });

  it('marks the answer as failed on an error event, keeping the partial text', () => {
    const state = apply(
      started(),
      { type: 'text', text: 'partial' },
      { type: 'error', message: 'Agent failed' },
    );
    expect(answer(state)).toMatchObject({
      content: 'partial',
      status: 'error',
      error: 'Agent failed',
    });
  });

  it('marks the answer as aborted', () => {
    expect(answer(chatReducer(started(), { type: 'abort' })).status).toBe('aborted');
  });

  it('ignores events once the answer is no longer streaming', () => {
    const done = apply(started(), { type: 'done', text: 'Final', turns: 1, durationMs: 1 });
    expect(apply(done, { type: 'text', text: 'late' }).messages).toEqual(done.messages);
    expect(chatReducer(done, { type: 'abort' }).messages).toEqual(done.messages);
  });

  it('clears the conversation', () => {
    expect(chatReducer(started(), { type: 'clear' })).toEqual(initialChatState());
  });
});

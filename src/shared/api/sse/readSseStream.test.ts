import { describe, expect, it } from 'vitest';
import { readSseStream, type SseMessage } from './readSseStream';

const streamOf = (...chunks: string[]) => {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
};

const collect = async (stream: ReadableStream<Uint8Array>) => {
  const messages: SseMessage[] = [];
  for await (const message of readSseStream(stream)) messages.push(message);
  return messages;
};

describe('readSseStream', () => {
  it('parses events with their data', async () => {
    const messages = await collect(
      streamOf('event: text\ndata: {"a":1}\n\n', 'event: done\ndata: {"b":2}\n\n'),
    );
    expect(messages).toEqual([
      { event: 'text', data: '{"a":1}' },
      { event: 'done', data: '{"b":2}' },
    ]);
  });

  it('joins messages split across chunks', async () => {
    const messages = await collect(streamOf('event: te', 'xt\ndata: {"a"', ':1}\n', '\n'));
    expect(messages).toEqual([{ event: 'text', data: '{"a":1}' }]);
  });

  it('handles CRLF, multi-line data, comments and the default event name', async () => {
    const messages = await collect(streamOf(': ping\r\n\r\ndata: line1\r\ndata: line2\r\n\r\n'));
    expect(messages).toEqual([{ event: 'message', data: 'line1\nline2' }]);
  });

  it('flushes a last message without the trailing blank line', async () => {
    const messages = await collect(streamOf('event: done\ndata: x'));
    expect(messages).toEqual([{ event: 'done', data: 'x' }]);
  });
});

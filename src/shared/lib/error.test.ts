import { describe, expect, it } from 'vitest';
import { normalizeError } from './error';

describe('normalizeError', () => {
  it('returns Error instances unchanged', () => {
    const error = new TypeError('boom');
    expect(normalizeError(error)).toBe(error);
  });

  it('wraps a string', () => {
    expect(normalizeError('offline')).toEqual(new Error('offline'));
  });

  it('uses the message of an error-like object', () => {
    expect(normalizeError({ message: 'Note not found', status: 404 }).message).toBe(
      'Note not found',
    );
  });

  it('serializes other objects', () => {
    expect(normalizeError({ code: 'E1' }).message).toBe('{"code":"E1"}');
  });

  it('does not throw for objects that cannot be serialized', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(normalizeError(circular).message).toBe('Unserializable object error');
  });

  it.each([
    [undefined, 'undefined'],
    [null, 'null'],
    [42, '42'],
  ])('stringifies %j', (value, message) => {
    expect(normalizeError(value).message).toBe(message);
  });
});

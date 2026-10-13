import { describe, expect, it } from 'vitest';
import { isApiErrorResponseData } from './typeGuards';

describe('isApiErrorResponseData', () => {
  it.each([{ message: 'x' }, { message: undefined }, { message: ['a', 'b'], statusCode: 400 }])(
    'accepts an object with a message: %j',
    (data) => {
      expect(isApiErrorResponseData(data)).toBe(true);
    },
  );

  it.each([null, undefined, 'error', 500, {}, { error: 'x' }])('rejects %j', (data) => {
    expect(isApiErrorResponseData(data)).toBe(false);
  });
});

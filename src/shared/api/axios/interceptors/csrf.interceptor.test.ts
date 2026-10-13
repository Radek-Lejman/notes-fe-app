import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestClient } from '../../../lib/test/axios';
import { setupCsrfInterceptor } from './csrf.interceptor';
import { setupErrorInterceptor } from './error.interceptor';

const tokenSource = () => {
  let n = 0;
  return vi.fn(() => Promise.resolve({ csrfToken: `token-${++n}` }));
};

const csrfHeader = (headers: unknown) => (headers as Record<string, unknown>)['X-CSRF-Token'];

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CSRF interceptor', () => {
  it('sends no token with GET requests', async () => {
    const { client, adapter } = createTestClient(() => ({ status: 200 }));
    const getCsrfToken = tokenSource();
    setupCsrfInterceptor(client, { getCsrfToken });

    await client.get('/notes');

    expect(getCsrfToken).not.toHaveBeenCalled();
    expect(csrfHeader(adapter.mock.calls[0][0].headers)).toBeUndefined();
  });

  it.each(['post', 'put', 'patch', 'delete'] as const)(
    'attaches the token to %s requests',
    async (method) => {
      const { client, adapter } = createTestClient(() => ({ status: 200 }));
      setupCsrfInterceptor(client, { getCsrfToken: tokenSource() });

      await client.request({ url: '/notes', method });

      expect(csrfHeader(adapter.mock.calls[0][0].headers)).toBe('token-1');
    },
  );

  it('fetches the token once and reuses it', async () => {
    const { client, adapter } = createTestClient(() => ({ status: 200 }));
    const getCsrfToken = tokenSource();
    setupCsrfInterceptor(client, { getCsrfToken });

    await client.post('/notes', {});
    await client.patch('/notes/1', {});

    expect(getCsrfToken).toHaveBeenCalledOnce();
    expect(csrfHeader(adapter.mock.calls[1][0].headers)).toBe('token-1');
  });

  it('on 403 fetches a fresh token and retries with it', async () => {
    let calls = 0;
    const { client, adapter } = createTestClient(() => ({ status: ++calls === 1 ? 403 : 200 }));
    setupCsrfInterceptor(client, { getCsrfToken: tokenSource() });

    await expect(client.post('/notes', {})).resolves.toMatchObject({ status: 200 });
    expect(csrfHeader(adapter.mock.calls[1][0].headers)).toBe('token-2');
  });

  it('passes other errors through', async () => {
    const { client } = createTestClient(() => ({ status: 500 }));
    setupCsrfInterceptor(client, { getCsrfToken: tokenSource() });

    await expect(client.post('/notes', {})).rejects.toMatchObject({ response: { status: 500 } });
  });

  // Known defect D2 (docs/testing/unit-test-audit.md): the retry has no guard, so a 403 that is
  // not about CSRF (AI_CREDENTIALS_REQUIRED) is retried forever. Remove `.fails` once fixed.
  it.fails('retries a 403 at most once', async () => {
    const { client, adapter } = createTestClient((config) => {
      if (adapter.mock.calls.length > 5) throw new Error('retry loop');
      return { status: config.url ? 403 : 200 };
    });
    setupCsrfInterceptor(client, { getCsrfToken: tokenSource() });

    await expect(client.post('/ai/chat', {})).rejects.toMatchObject({ response: { status: 403 } });
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  // Known defect D1: in the app the error interceptor is registered first (client.ts) and turns
  // the AxiosError into an ApiError without `.response`, so the CSRF 403 retry never runs.
  // Remove `.fails` once fixed.
  it.fails('retries a CSRF 403 when composed like the app (error interceptor first)', async () => {
    let calls = 0;
    const { client } = createTestClient(() => ({ status: ++calls === 1 ? 403 : 200 }));
    setupErrorInterceptor(client);
    setupCsrfInterceptor(client, { getCsrfToken: tokenSource() });

    await expect(client.post('/notes', {})).resolves.toMatchObject({ status: 200 });
  });
});

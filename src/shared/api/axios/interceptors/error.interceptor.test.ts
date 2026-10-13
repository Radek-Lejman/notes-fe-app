import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestClient, type Reply } from '../../../lib/test/axios';
import { ApiError } from '../lib/ApiError';
import { setupErrorInterceptor } from './error.interceptor';

const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/** The session expires once: the first call of each URL gets 401, later calls succeed. */
const expiringSession = () => {
  const seen = new Set<string>();
  return (url = ''): Reply => {
    if (seen.has(url)) return { status: 200, data: { url } };
    seen.add(url);
    return { status: 401, data: { message: 'Unauthorized' } };
  };
};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('error interceptor — error mapping', () => {
  it('rejects with an ApiError carrying the status, server message and body', async () => {
    const body = { message: 'Note not found', statusCode: 404 };
    const { client } = createTestClient(() => ({ status: 404, data: body }));
    setupErrorInterceptor(client);

    const error = await client.get('/notes/1').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, message: 'Note not found', details: body });
  });

  it('falls back to the axios message when the body has no message', async () => {
    const { client } = createTestClient(() => ({ status: 500, data: 'Internal error' }));
    setupErrorInterceptor(client);

    await expect(client.get('/notes')).rejects.toMatchObject({
      status: 500,
      message: 'Request failed with status code 500',
    });
  });

  it('uses status 0 for a request without a response (network error)', async () => {
    const { client } = createTestClient(() => {
      throw new Error('Network Error');
    });
    setupErrorInterceptor(client);

    await expect(client.get('/notes')).rejects.toMatchObject({ status: 0 });
  });
});

describe('error interceptor — 401 and token refresh', () => {
  it('refreshes the session and retries the request once', async () => {
    const reply = expiringSession();
    const { client, adapter } = createTestClient((config) => reply(config.url));
    const refreshFn = vi.fn(() => Promise.resolve());
    setupErrorInterceptor(client, { refreshFn });

    const response = await client.get('/notes');

    expect(response.data).toEqual({ url: '/notes' });
    expect(refreshFn).toHaveBeenCalledOnce();
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it('does not refresh requests marked with _skipAuthRefresh', async () => {
    const { client } = createTestClient(() => ({ status: 401, data: { message: 'No session' } }));
    const refreshFn = vi.fn(() => Promise.resolve());
    setupErrorInterceptor(client, { refreshFn });

    await expect(client.get('/auth/me', { _skipAuthRefresh: true })).rejects.toMatchObject({
      status: 401,
    });
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it('gives up after one retry instead of looping', async () => {
    const { client, adapter } = createTestClient(() => ({ status: 401 }));
    const refreshFn = vi.fn(() => Promise.resolve());
    const onUnauthorized = vi.fn();
    setupErrorInterceptor(client, { refreshFn, onUnauthorized });

    await expect(client.get('/notes')).rejects.toMatchObject({ status: 401 });
    expect(refreshFn).toHaveBeenCalledOnce();
    expect(adapter).toHaveBeenCalledTimes(2);
  });

  it('logs the user out when the refresh fails', async () => {
    const { client } = createTestClient(() => ({ status: 401, data: { message: 'Expired' } }));
    const onUnauthorized = vi.fn();
    setupErrorInterceptor(client, {
      refreshFn: () => Promise.reject(new Error('refresh token expired')),
      onUnauthorized,
    });

    // The caller sees the original 401, not the refresh error.
    await expect(client.get('/notes')).rejects.toMatchObject({ status: 401, message: 'Expired' });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('logs the user out on a 401 from the refresh endpoint itself, without refreshing again', async () => {
    const { client } = createTestClient(() => ({ status: 401 }));
    const refreshFn = vi.fn(() => Promise.resolve());
    const onUnauthorized = vi.fn();
    setupErrorInterceptor(client, { refreshFn, onUnauthorized });

    await expect(client.post('/auth/refresh')).rejects.toMatchObject({ status: 401 });
    expect(refreshFn).not.toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('logs the user out when no refresh function is configured', async () => {
    const { client } = createTestClient(() => ({ status: 401 }));
    const onUnauthorized = vi.fn();
    setupErrorInterceptor(client, { onUnauthorized });

    await expect(client.get('/notes')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('refreshes once for concurrent 401s and retries all of them', async () => {
    const reply = expiringSession();
    const { client } = createTestClient((config) => reply(config.url));
    const refresh = deferred();
    const refreshFn = vi.fn(() => refresh.promise);
    setupErrorInterceptor(client, { refreshFn });

    const first = client.get('/notes');
    await vi.waitFor(() => expect(refreshFn).toHaveBeenCalled());
    const second = client.get('/ai/settings');
    await new Promise((resolve) => setTimeout(resolve, 0));
    refresh.resolve();

    await expect(first).resolves.toMatchObject({ data: { url: '/notes' } });
    await expect(second).resolves.toMatchObject({ data: { url: '/ai/settings' } });
    expect(refreshFn).toHaveBeenCalledOnce();
  });

  it('rejects queued requests when the shared refresh fails', async () => {
    const { client } = createTestClient(() => ({ status: 401 }));
    const refresh = deferred();
    const onUnauthorized = vi.fn();
    setupErrorInterceptor(client, { refreshFn: () => refresh.promise, onUnauthorized });

    const first = client.get('/notes').catch((e: unknown) => e);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const second = client.get('/ai/settings').catch((e: unknown) => e);
    await new Promise((resolve) => setTimeout(resolve, 0));
    refresh.reject(new Error('refresh token expired'));

    expect(await first).toMatchObject({ status: 401 });
    expect(await second).toMatchObject({ message: 'refresh token expired' });
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});

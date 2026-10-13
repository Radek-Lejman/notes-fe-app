import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AxiosResponse } from 'axios';
import { waitFor } from '@testing-library/react';
import { apiClient } from '@shared/api/axios/client';
import { renderHookWithProviders } from '@shared/lib/test/render';
import { AuthApi } from './session.api';
import { useSession } from './useSession';

const ok = <T>(data: T) => Promise.resolve({ data } as AxiosResponse<T>);
const credentials = { email: 'ada@example.com', password: 'secret123' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthApi', () => {
  it.each([
    ['login', '/auth/login'],
    ['register', '/auth/register'],
  ] as const)('%s posts the credentials', async (method, url) => {
    const post = vi.spyOn(apiClient, 'post').mockReturnValue(ok({ message: 'ok' }));

    await expect(AuthApi[method](credentials)).resolves.toEqual({ message: 'ok' });
    expect(post).toHaveBeenCalledWith(url, credentials);
  });

  it.each([
    ['refresh', '/auth/refresh'],
    ['logout', '/auth/logout'],
  ] as const)('%s posts to %s', async (method, url) => {
    const post = vi.spyOn(apiClient, 'post').mockReturnValue(ok({ message: 'ok' }));

    await AuthApi[method]();

    expect(post).toHaveBeenCalledWith(url);
  });

  it('checks the session without triggering a token refresh', async () => {
    const get = vi.spyOn(apiClient, 'get').mockReturnValue(ok({ sub: 'u1' }));

    await expect(AuthApi.me()).resolves.toEqual({ sub: 'u1' });
    // Otherwise a logged-out visitor would cause a refresh attempt on every page load.
    expect(get).toHaveBeenCalledWith('/auth/me', { _skipAuthRefresh: true });
  });

  it('fetches the CSRF token', async () => {
    const get = vi.spyOn(apiClient, 'get').mockReturnValue(ok({ csrfToken: 't' }));

    await expect(AuthApi.getCsrfToken()).resolves.toEqual({ csrfToken: 't' });
    expect(get).toHaveBeenCalledWith('/csrf-token');
  });
});

describe('useSession', () => {
  it('returns the logged-in user', async () => {
    vi.spyOn(AuthApi, 'me').mockResolvedValue({ sub: 'u1', email: 'ada@example.com' });

    const { result } = renderHookWithProviders(() => useSession());

    await waitFor(() => expect(result.current.data?.sub).toBe('u1'));
  });

  it('does not retry when there is no session', async () => {
    const me = vi.spyOn(AuthApi, 'me').mockRejectedValue(new Error('401'));

    const { result } = renderHookWithProviders(() => useSession());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(me).toHaveBeenCalledOnce();
  });
});

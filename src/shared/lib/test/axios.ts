import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { vi } from 'vitest';

export type Reply = { status: number; data?: unknown };
export type Responder = (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>;

/**
 * An axios instance whose requests never leave the test: `respond` decides the reply. Non-2xx
 * replies reject with an AxiosError, like the real adapters do.
 */
export const createTestClient = (respond: Responder) => {
  const adapter = vi.fn(async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const { status, data } = await respond(config);
    const response: AxiosResponse = { status, data, statusText: '', headers: {}, config };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError(
      `Request failed with status code ${status}`,
      AxiosError.ERR_BAD_RESPONSE,
      config,
      null,
      response,
    );
  });
  const client = axios.create({ baseURL: 'http://api.test', adapter });
  return { client, adapter };
};

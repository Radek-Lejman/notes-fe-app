import { apiClient } from '@shared/api/axios/client';
import { ApiError } from '@shared/api';
import { readSseStream } from '@shared/api/sse';
import type {
  AiSettings,
  AssistRequest,
  AssistResponse,
  ChatEvent,
  ChatRequest,
  CredentialStatus,
  CredentialTestResult,
  SaveCredentialPayload,
} from '../model/types';

// Agent runs can take minutes (several tool calls); BE aborts on its own timeout.
const CHAT_TIMEOUT_MS = 5 * 60 * 1000;
const CREDENTIAL_TEST_TIMEOUT_MS = 90 * 1000;
// One model call, no tools; the CLI provider can still take a while to start.
const ASSIST_TIMEOUT_MS = 2 * 60 * 1000;

/** Error responses of a stream request arrive as a stream too — read their JSON body. */
async function withReadableError(error: unknown): Promise<never> {
  if (error instanceof ApiError && error.details instanceof ReadableStream) {
    try {
      const text = await new Response(error.details).text();
      const body = JSON.parse(text) as { message?: string | string[] };
      const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      throw new ApiError(error.status, message ?? error.message, body);
    } catch (e) {
      if (e instanceof ApiError) throw e;
    }
  }
  throw error;
}

export const AiChatApi = {
  /**
   * One chat turn as a stream of events. Goes through apiClient (fetch adapter),
   * so CSRF and the 401 -> refresh -> retry flow work as for other requests.
   */
  streamChat: async function* (
    payload: ChatRequest,
    signal?: AbortSignal,
  ): AsyncGenerator<ChatEvent> {
    const { data } = await apiClient
      .post<ReadableStream<Uint8Array>>('/ai/chat', payload, {
        adapter: 'fetch',
        responseType: 'stream',
        timeout: CHAT_TIMEOUT_MS,
        signal,
        headers: { Accept: 'text/event-stream' },
      })
      .catch(withReadableError);

    for await (const message of readSseStream(data)) {
      yield JSON.parse(message.data) as ChatEvent;
    }
  },

  assist: async (payload: AssistRequest, signal?: AbortSignal): Promise<AssistResponse> => {
    const { data } = await apiClient.post<AssistResponse>('/ai/assist', payload, {
      timeout: ASSIST_TIMEOUT_MS,
      signal,
    });
    return data;
  },

  getSettings: async (): Promise<AiSettings> => {
    const { data } = await apiClient.get<AiSettings>('/ai/settings');
    return data;
  },

  saveCredential: async (payload: SaveCredentialPayload): Promise<CredentialStatus> => {
    const { data } = await apiClient.put<CredentialStatus>('/ai/credentials', payload);
    return data;
  },

  removeCredential: async (): Promise<void> => {
    await apiClient.delete('/ai/credentials');
  },

  testCredential: async (): Promise<CredentialTestResult> => {
    const { data } = await apiClient.post<CredentialTestResult>('/ai/credentials/test', null, {
      timeout: CREDENTIAL_TEST_TIMEOUT_MS,
    });
    return data;
  },
};

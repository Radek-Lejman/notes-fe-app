import type { ApiErrorResponseData } from '../model/types';

export function isApiErrorResponseData(data: unknown): data is ApiErrorResponseData {
  return typeof data === 'object' && data !== null && 'message' in data;
}

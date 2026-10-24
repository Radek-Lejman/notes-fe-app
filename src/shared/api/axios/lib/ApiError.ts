export class ApiError extends Error {
  status: number;
  details?: unknown;

  /** `options.cause` keeps the original AxiosError, so later interceptors can still retry it. */
  constructor(status: number, message: string, details?: unknown, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

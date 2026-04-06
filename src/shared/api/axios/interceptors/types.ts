export interface SetupErrorInterceptorOptions {
  onUnauthorized?: () => void;
  refreshFn?: () => Promise<unknown>;
}

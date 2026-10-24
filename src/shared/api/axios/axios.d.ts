import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
    _csrfRetry?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
    _csrfRetry?: boolean;
  }
}

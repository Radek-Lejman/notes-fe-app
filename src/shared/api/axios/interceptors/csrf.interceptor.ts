import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";

type GetTokenFn = () => Promise<{ csrfToken: string }>;

export const setupCsrfInterceptor = (
  client: AxiosInstance,
  options: { getCsrfToken: GetTokenFn }
) => {
  let csrfToken: string | null = null;

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const method = config.method?.toUpperCase();

      const requiresCsrf =
        method === "POST" ||
        method === "PUT" ||
        method === "PATCH" ||
        method === "DELETE";

      if (!requiresCsrf) return config;

      if (!csrfToken) {
        const { csrfToken: newToken } = await options.getCsrfToken();
        csrfToken = newToken;
      }

      config.headers["X-CSRF-Token"] = csrfToken!;
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      if (error.response?.status === 403) {
        const { csrfToken: newToken } = await options.getCsrfToken();
        csrfToken = newToken;
        
        error.config!.headers["X-CSRF-Token"] = csrfToken!;
        return client.request(error.config!);
      }

      return Promise.reject(error);
    }
  );
};

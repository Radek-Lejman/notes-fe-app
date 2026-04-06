import { QueryClient } from "@tanstack/react-query";
import { MINUTE_IN_MS } from "../lib/utils/time";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2 * MINUTE_IN_MS,
      gcTime: 10 * MINUTE_IN_MS,
      refetchOnWindowFocus: false,
    },
  },
});

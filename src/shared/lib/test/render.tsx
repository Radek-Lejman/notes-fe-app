/* eslint-disable react-refresh/only-export-components -- test helpers, never hot-reloaded */
import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

/** A fresh client per test: no retries, no shared cache between tests. */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

interface ProviderOptions {
  queryClient?: QueryClient;
  /** Initial history entries of the MemoryRouter. */
  route?: string | { pathname: string; state?: unknown };
  /** Route pattern the UI is mounted under, e.g. `/note/:id`, so `useParams` works. */
  path?: string;
}

/** Renders the current location, so tests can assert on navigation. */
export const LocationProbe = () => {
  const location = useLocation();
  return (
    <div data-testid="location" data-state={JSON.stringify(location.state ?? null)}>
      {location.pathname}
    </div>
  );
};

const createWrapper = ({ queryClient, route = '/', path }: ProviderOptions) => {
  const client = queryClient ?? createTestQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ChakraProvider value={defaultSystem}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>
          {path ? (
            <Routes>
              <Route path={path} element={children} />
              <Route path="*" element={<LocationProbe />} />
            </Routes>
          ) : (
            children
          )}
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );
  return { Wrapper, client };
};

/** `render` inside Chakra, React Query and a MemoryRouter. */
export const renderWithProviders = (
  ui: ReactElement,
  options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) => {
  const { queryClient, route, path, ...renderOptions } = options;
  const { Wrapper, client } = createWrapper({ queryClient, route, path });
  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient: client };
};

/** `renderHook` inside the same providers as `renderWithProviders`. */
export const renderHookWithProviders = <Result, Props>(
  hook: (props: Props) => Result,
  options: ProviderOptions & { initialProps?: Props } = {},
) => {
  const { queryClient, route, path, initialProps } = options;
  const { Wrapper, client } = createWrapper({ queryClient, route, path });
  return { ...renderHook(hook, { wrapper: Wrapper, initialProps }), queryClient: client };
};

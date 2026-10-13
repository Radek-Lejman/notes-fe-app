import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { screen, within } from '@testing-library/react';
import { createRoutesFromElements, matchRoutes } from 'react-router-dom';
import { AuthApi } from '@entities/session';
import { NotesApi } from '@entities/notes';
import { ApiError } from '@shared/api';
import { renderWithProviders } from '@shared/lib/test/render';
import { AppRoutes } from './AppRoutes';

const loggedIn = () => {
  vi.spyOn(AuthApi, 'me').mockResolvedValue({ sub: 'u1', email: 'ada@example.com' });
  vi.spyOn(NotesApi, 'getNotes').mockResolvedValue([]);
};
const loggedOut = () => vi.spyOn(AuthApi, 'me').mockRejectedValue(new ApiError(401, 'No session'));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppRoutes', () => {
  it('shows the welcome page to a logged-in user', async () => {
    loggedIn();
    renderWithProviders(<AppRoutes />, { route: '/' });

    expect(await screen.findByRole('heading', { name: 'Welcome!' })).toBeInTheDocument();
  });

  it.each(['/', '/note', '/note/n1'])(
    'sends a visitor from %s to the login page',
    async (route) => {
      loggedOut();
      renderWithProviders(<AppRoutes />, { route });

      expect(await screen.findByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText(/session has expired/)).toBeInTheDocument();
    },
  );

  it('opens the editor for a new note', async () => {
    loggedIn();
    renderWithProviders(<AppRoutes />, { route: '/note' });

    expect(await screen.findByText('Create Note')).toBeInTheDocument();
  });

  it('shows the register page to a visitor', async () => {
    loggedOut();
    renderWithProviders(<AppRoutes />, { route: '/register' });

    expect(await screen.findByText('Create an account')).toBeInTheDocument();
  });

  // Known defect D6 (docs/testing/unit-test-audit.md): the side panel links to /settings, but
  // there is no such route. Remove `.fails` once the route exists or the link is removed.
  it.fails('has a page for every link in the side panel', async () => {
    loggedIn();
    renderWithProviders(<AppRoutes />, { route: '/' });
    const panel = await screen.findByRole('complementary');
    await within(panel).findByRole('link', { name: 'Home' });

    const routes = createRoutesFromElements(
      (AppRoutes() as ReactElement<{ children: ReactNode }>).props.children,
    );
    const unrouted = within(panel)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => !matchRoutes(routes, href));

    expect(unrouted).toEqual([]);
  });
});

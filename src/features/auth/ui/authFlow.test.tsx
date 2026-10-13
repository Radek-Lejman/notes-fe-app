import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { AuthApi } from '@entities/session';
import { ApiError } from '@shared/api';
import { LocationProbe, renderWithProviders } from '@shared/lib/test/render';
import { isAuthNavigationState } from '../lib/guards';
import { RedirectIfAuth } from './guards/RedirectIfAuth';
import { RequireAuth } from './guards/RequireAuth';
import { LoginPageContainer } from './LoginPageContainer';
import { RegisterPageContainer } from './RegisterPageContainer';
import { ShowOnlyUser } from './ShowOnlyUser';

const user = { sub: 'u1', email: 'ada@example.com' };
const loggedIn = () => vi.spyOn(AuthApi, 'me').mockResolvedValue(user);
const loggedOut = () => vi.spyOn(AuthApi, 'me').mockRejectedValue(new ApiError(401, 'No session'));

/** Mounts the page at the route's path; every other path shows where the app navigated to. */
const renderAt = (route: string | { pathname: string; state?: unknown }, page: React.ReactNode) =>
  renderWithProviders(
    <Routes>
      <Route path={typeof route === 'string' ? route : route.pathname} element={page} />
      <Route path="*" element={<LocationProbe />} />
    </Routes>,
    { route },
  );

const fillAndSubmit = async (button: string) => {
  await userEvent.type(screen.getByPlaceholderText('Enter your email'), 'ada@example.com');
  await userEvent.type(screen.getByLabelText(/Password/), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: button }));
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RequireAuth', () => {
  it('renders the page for a logged-in user', async () => {
    loggedIn();
    renderAt(
      '/private',
      <RequireAuth>
        <p>Private notes</p>
      </RequireAuth>,
    );

    expect(await screen.findByText('Private notes')).toBeInTheDocument();
  });

  it('sends a visitor to the login page and says the session expired', async () => {
    loggedOut();
    renderAt(
      '/private',
      <RequireAuth>
        <p>Private notes</p>
      </RequireAuth>,
    );

    const location = await screen.findByTestId('location');
    expect(location).toHaveTextContent('/login');
    expect(location).toHaveAttribute('data-state', '{"sessionExpired":true}');
    expect(screen.queryByText('Private notes')).not.toBeInTheDocument();
  });

  it('renders nothing while the session is being checked', () => {
    vi.spyOn(AuthApi, 'me').mockReturnValue(new Promise(() => {}));
    const { container } = renderAt(
      '/private',
      <RequireAuth>
        <p>Private notes</p>
      </RequireAuth>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('RedirectIfAuth', () => {
  it('sends a logged-in user home', async () => {
    loggedIn();
    renderAt(
      '/login',
      <RedirectIfAuth>
        <p>Login form</p>
      </RedirectIfAuth>,
    );

    expect(await screen.findByTestId('location')).toHaveTextContent(/^\/$/);
  });

  it('shows the page to a visitor', async () => {
    loggedOut();
    renderAt(
      '/login',
      <RedirectIfAuth>
        <p>Login form</p>
      </RedirectIfAuth>,
    );

    expect(await screen.findByText('Login form')).toBeInTheDocument();
  });
});

describe('ShowOnlyUser', () => {
  it('renders the children with the user', async () => {
    loggedIn();
    renderWithProviders(<ShowOnlyUser>{(u) => <p>Hello {u.email}</p>}</ShowOnlyUser>);

    expect(await screen.findByText('Hello ada@example.com')).toBeInTheDocument();
  });

  it('renders the fallback for a visitor', async () => {
    loggedOut();
    renderWithProviders(
      <ShowOnlyUser fallback={<p>Please log in</p>}>{() => <p>Secret</p>}</ShowOnlyUser>,
    );

    expect(await screen.findByText('Please log in')).toBeInTheDocument();
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });
});

describe('LoginPageContainer', () => {
  it('logs in and goes to the home page', async () => {
    const login = vi.spyOn(AuthApi, 'login').mockResolvedValue({ message: 'ok' });
    renderAt('/login', <LoginPageContainer />);

    await fillAndSubmit('Login');

    expect(login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secret123' });
    expect(await screen.findByTestId('location')).toHaveTextContent(/^\/$/);
  });

  it('shows the server error and stays on the page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(AuthApi, 'login').mockRejectedValue(new ApiError(401, 'Invalid credentials'));
    renderAt('/login', <LoginPageContainer />);

    await fillAndSubmit('Login');

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
  });

  it('explains a redirect after the session expired', () => {
    renderAt({ pathname: '/login', state: { sessionExpired: true } }, <LoginPageContainer />);

    expect(screen.getByText(/session has expired/)).toBeInTheDocument();
  });

  it('does not mention an expired session on a normal visit', () => {
    renderAt('/login', <LoginPageContainer />);

    expect(screen.queryByText(/session has expired/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/register');
  });
});

describe('RegisterPageContainer', () => {
  it('registers and goes to the home page', async () => {
    const register = vi.spyOn(AuthApi, 'register').mockResolvedValue({ message: 'ok' });
    renderAt('/register', <RegisterPageContainer />);

    await fillAndSubmit('Register');

    expect(register).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secret123' });
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
  });

  it('shows the server error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(AuthApi, 'register').mockRejectedValue(new ApiError(409, 'Email already in use'));
    renderAt('/register', <RegisterPageContainer />);

    await fillAndSubmit('Register');

    expect(await screen.findByText('Email already in use')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/login');
  });
});

describe('isAuthNavigationState', () => {
  it.each([
    [{ sessionExpired: true }, true],
    [{ sessionExpired: undefined }, true],
    [{ from: '/' }, false],
    [null, false],
    ['expired', false],
  ])('%j -> %s', (state, expected) => {
    expect(isAuthNavigationState(state)).toBe(expected);
  });
});

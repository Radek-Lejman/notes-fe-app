import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { AuthApi } from '@entities/session';
import { NotesApi } from '@entities/notes';
import { ApiError } from '@shared/api';
import { renderWithProviders } from '@shared/lib/test/render';
import { mapNotesToNavItems } from './lib/fromNotesToNavitem';
import { SidePanelWidget } from './ui/SidePanelWidget';
import { SidePanelUserHeader } from './ui/SidePanelUserHeader/SidePanelUserHeader';
import { SidePanelWidgetNavItems } from './ui/SidePanelWidgetNavigation/SidePanelWidgetNavigation';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mapNotesToNavItems', () => {
  it('links every note to its edit page', () => {
    expect(mapNotesToNavItems([{ id: 'n1', title: 'Docker', createdAt: '2026-01-01' }])).toEqual([
      { id: 'n1', label: 'Docker', path: '/note/n1', icon: 'FileText' },
    ]);
  });

  it('maps an empty list', () => {
    expect(mapNotesToNavItems([])).toEqual([]);
  });
});

describe('SidePanelWidgetNavItems', () => {
  it('renders the links', () => {
    renderWithProviders(
      <SidePanelWidgetNavItems items={[{ id: 'a', label: 'Docker', path: '/note/a', icon: '' }]} />,
    );
    expect(screen.getByRole('link', { name: 'Docker' })).toHaveAttribute('href', '/note/a');
  });

  it('says when there is nothing to show', () => {
    renderWithProviders(<SidePanelWidgetNavItems items={[]} />);
    expect(screen.getByText('Lists are empty')).toBeInTheDocument();
  });
});

describe('SidePanelUserHeader', () => {
  it('shows the email and the name before the @', async () => {
    vi.spyOn(AuthApi, 'me').mockResolvedValue({ sub: 'u1', email: 'ada.lovelace@example.com' });
    renderWithProviders(<SidePanelUserHeader />);

    expect(await screen.findByText('ada.lovelace@example.com')).toBeInTheDocument();
    expect(screen.getByText('ada.lovelace')).toBeInTheDocument();
  });

  it('shows the app name for a visitor', async () => {
    vi.spyOn(AuthApi, 'me').mockRejectedValue(new ApiError(401, 'No session'));
    renderWithProviders(<SidePanelUserHeader />);

    expect(await screen.findByText('Notes APP')).toBeInTheDocument();
  });
});

describe('SidePanelWidget', () => {
  it('shows search, navigation and the notes to a logged-in user', async () => {
    vi.spyOn(AuthApi, 'me').mockResolvedValue({ sub: 'u1', email: 'ada@example.com' });
    vi.spyOn(NotesApi, 'getNotes').mockResolvedValue([
      { id: 'n1', title: 'Docker', createdAt: '2026-01-01' },
    ]);
    renderWithProviders(<SidePanelWidget searchSlot={<button>Search</button>} />);

    const panel = await screen.findByRole('complementary');
    expect(await within(panel).findByRole('link', { name: 'Docker' })).toHaveAttribute(
      'href',
      '/note/n1',
    );
    expect(within(panel).getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Create note' })).toHaveAttribute(
      'href',
      '/note',
    );
  });

  it('invites a visitor to log in, without search or notes', async () => {
    vi.spyOn(AuthApi, 'me').mockRejectedValue(new ApiError(401, 'No session'));
    const getNotes = vi.spyOn(NotesApi, 'getNotes');
    renderWithProviders(<SidePanelWidget searchSlot={<button>Search</button>} />);

    expect(await screen.findByRole('link', { name: 'Zaloguj się' })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('link', { name: 'Załóż konto' })).toHaveAttribute('href', '/register');
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
    expect(getNotes).not.toHaveBeenCalled();
  });

  it('shows the error when the notes cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(AuthApi, 'me').mockResolvedValue({ sub: 'u1' });
    vi.spyOn(NotesApi, 'getNotes').mockRejectedValue(new Error('Notes unavailable'));
    renderWithProviders(<SidePanelWidget />);

    expect(await screen.findByText('Notes unavailable')).toBeInTheDocument();
  });
});

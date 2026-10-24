import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { NotesApi } from '@entities/notes';
import {
  LocationProbe,
  renderHookWithProviders,
  renderWithProviders,
} from '@shared/lib/test/render';
import { DEFAULT_SEARCH_FILTERS, SEARCH_ORDER_OPTIONS } from './config/constants';
import { useNoteSearch } from './model/useNoteSearch';
import { NoteSearch } from './ui/NoteSearch';

const hits = [
  { id: 'n1', title: 'Docker', snippet: 'Containers with docker compose' },
  { id: 'n2', title: '', snippet: '' },
];

const renderSearch = (onItemSelect?: (id: string) => void) =>
  renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={
          <NoteSearch.Root onItemSelect={onItemSelect}>
            <NoteSearch.Input />
            <NoteSearch.Filters />
            <NoteSearch.Results />
          </NoteSearch.Root>
        }
      />
      <Route path="*" element={<LocationProbe />} />
    </Routes>,
  );

const search = async (text: string) => {
  await userEvent.type(screen.getByPlaceholderText('Search notes...'), text);
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useNoteSearch', () => {
  it('does not search for an empty query', () => {
    const searchNote = vi.spyOn(NotesApi, 'searchNote');
    const { result } = renderHookWithProviders(() => useNoteSearch());

    expect(result.current.results).toEqual([]);
    expect(searchNote).not.toHaveBeenCalled();
  });

  it('searches with the debounced query and the default filters', async () => {
    const searchNote = vi.spyOn(NotesApi, 'searchNote').mockResolvedValue(hits);
    const { result } = renderHookWithProviders(() => useNoteSearch());

    act(() => result.current.setQuery('docker'));
    expect(result.current.debouncedQuery).toBe('');

    await waitFor(() => expect(result.current.results).toEqual(hits));
    expect(searchNote).toHaveBeenCalledWith({ q: 'docker', ...DEFAULT_SEARCH_FILTERS });
  });

  it('merges filter changes into the current filters', async () => {
    const searchNote = vi.spyOn(NotesApi, 'searchNote').mockResolvedValue([]);
    const { result } = renderHookWithProviders(() => useNoteSearch());

    act(() => {
      result.current.setQuery('docker');
      result.current.setFilters({ limit: 50 });
    });

    expect(result.current.filters).toEqual({ ...DEFAULT_SEARCH_FILTERS, limit: 50 });
    await waitFor(() =>
      expect(searchNote).toHaveBeenLastCalledWith({
        q: 'docker',
        ...DEFAULT_SEARCH_FILTERS,
        limit: 50,
      }),
    );
  });

  it('ignores a whitespace-only query', async () => {
    const searchNote = vi.spyOn(NotesApi, 'searchNote');
    const { result } = renderHookWithProviders(() => useNoteSearch());

    act(() => result.current.setQuery('   '));
    await waitFor(() => expect(result.current.debouncedQuery).toBe('   '));

    expect(searchNote).not.toHaveBeenCalled();
  });
});

describe('NoteSearch UI', () => {
  it('lists the hits with their snippets', async () => {
    vi.spyOn(NotesApi, 'searchNote').mockResolvedValue(hits);
    renderSearch();

    await search('docker');

    expect(await screen.findByText('Found: 2')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('Containers with docker compose')).toBeInTheDocument();
    expect(screen.getByText('(no title)')).toBeInTheDocument();
  });

  it('opens the clicked note and tells the parent', async () => {
    vi.spyOn(NotesApi, 'searchNote').mockResolvedValue(hits);
    const onItemSelect = vi.fn();
    renderSearch(onItemSelect);

    await search('docker');
    await userEvent.click(await screen.findByText('Docker'));

    expect(screen.getByTestId('location')).toHaveTextContent('/note/n1');
    expect(onItemSelect).toHaveBeenCalledWith('n1');
  });

  it('says when nothing was found', async () => {
    vi.spyOn(NotesApi, 'searchNote').mockResolvedValue([]);
    renderSearch();

    await search('kubernetes');

    expect(await screen.findByText('No results for "kubernetes".')).toBeInTheDocument();
  });

  it('shows a loading state while searching', async () => {
    vi.spyOn(NotesApi, 'searchNote').mockReturnValue(new Promise(() => {}));
    renderSearch();

    await search('docker');

    expect(await screen.findByText('Searching...')).toBeInTheDocument();
  });

  it('shows the search error', async () => {
    vi.spyOn(NotesApi, 'searchNote').mockRejectedValue(new Error('Search unavailable'));
    renderSearch();

    await search('docker');

    expect(
      await screen.findByText('An error occurred during search: Search unavailable'),
    ).toBeInTheDocument();
  });

  it('renders nothing before the user types', () => {
    renderSearch();

    expect(screen.queryByText(/Found:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/No results/)).not.toBeInTheDocument();
  });

  it('applies the chosen filters to the search', async () => {
    const searchNote = vi.spyOn(NotesApi, 'searchNote').mockResolvedValue([]);
    renderSearch();
    const [order, limit, fields] = screen.getAllByRole('combobox');

    await userEvent.selectOptions(order, '-createdAt');
    await userEvent.selectOptions(limit, '50');
    await userEvent.selectOptions(fields, 'title,content');
    await search('docker');

    await waitFor(() =>
      expect(searchNote).toHaveBeenLastCalledWith({
        q: 'docker',
        order: '-createdAt',
        limit: 50,
        fields: 'title,content',
      }),
    );
  });

  it('fails loudly when a part is used outside NoteSearch.Root', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithProviders(<NoteSearch.Input />)).toThrow(/NoteSearch.Root/);
  });
});

describe('search order options', () => {
  const label = (value: string) => SEARCH_ORDER_OPTIONS.find((o) => o.value === value)?.label;

  it('offers every order the API accepts, once', () => {
    const values = SEARCH_ORDER_OPTIONS.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
    expect(values).toHaveLength(8);
  });

  // Defect D3 (docs/testing/unit-test-audit.md): BE sorts `title` ascending (A→Z) and `-title`
  // descending; the labels used to be swapped.
  it('labels the title order in the direction the API sorts', () => {
    expect(label('title')).toBe('Title A-Z');
    expect(label('-title')).toBe('Title Z-A');
  });
});

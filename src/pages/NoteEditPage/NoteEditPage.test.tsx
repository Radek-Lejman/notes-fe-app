import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { AiChatApi } from '@entities/ai-chat';
import { NotesApi, type Notes } from '@entities/notes';
import { ApiError } from '@shared/api';
import { editorOf, press, typeText } from '@shared/lib/test/editor';
import { renderWithProviders } from '@shared/lib/test/render';
import { NoteEditPage } from './ui/NoteEditPage';

const NOTE: Notes = {
  id: 'n1',
  title: 'Docker',
  content: '# Docker\n\nContainers.',
  createdAt: '2026-01-01',
};

const renderPage = (route: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/note/:id" element={<NoteEditPage />} />
      <Route path="/note" element={<NoteEditPage />} />
    </Routes>,
    { route },
  );

const titleInput = () => screen.findByPlaceholderText('Note Title');

/** The editor focuses itself after mounting; typing before that would land in the note body. */
const editorFocused = () =>
  waitFor(() => expect(screen.getByLabelText('Note content')).toHaveFocus());

const typeTitle = async (text: string) => {
  await editorFocused();
  await userEvent.type(await titleInput(), text);
};

beforeEach(() => {
  vi.spyOn(AiChatApi, 'getSettings').mockResolvedValue({ ready: true } as never);
  vi.spyOn(NotesApi, 'getNotes').mockResolvedValue([NOTE]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('NoteEditPage — editing', () => {
  it('loads the note into the editor', async () => {
    vi.spyOn(NotesApi, 'getNote').mockResolvedValue(NOTE);
    const { container } = renderPage('/note/n1');

    expect(screen.getByText('Loading Note...')).toBeInTheDocument();
    expect(await titleInput()).toHaveValue('Docker');
    expect(screen.getByText('Edit Note')).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector('h1')).toHaveTextContent('Docker'));
    expect(screen.getByRole('button', { name: /Ask AI/ })).toBeInTheDocument();
  });

  it('autosaves edits to the note', async () => {
    vi.spyOn(NotesApi, 'getNote').mockResolvedValue(NOTE);
    const update = vi
      .spyOn(NotesApi, 'updateNote')
      .mockImplementation((dto) => Promise.resolve({ ...NOTE, ...dto }));
    renderPage('/note/n1');

    await typeTitle(' 101');

    await waitFor(() => expect(update).toHaveBeenCalled(), { timeout: 3000 });
    expect(update.mock.calls.at(-1)?.[0]).toEqual({
      id: 'n1',
      title: 'Docker 101',
      content: '# Docker\n\nContainers.',
    });
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('shows a failed save', async () => {
    vi.spyOn(NotesApi, 'getNote').mockResolvedValue(NOTE);
    vi.spyOn(NotesApi, 'updateNote').mockRejectedValue(new ApiError(500, 'Database down'));
    renderPage('/note/n1');

    await typeTitle('!');

    expect(
      await screen.findByText('Error: Database down', {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it('creates a sub-note under this note and links it', async () => {
    const CHILD_ID = '11111111-2222-3333-4444-555555555555';
    vi.spyOn(NotesApi, 'getNote').mockResolvedValue(NOTE);
    vi.spyOn(NotesApi, 'updateNote').mockImplementation((dto) =>
      Promise.resolve({ ...NOTE, ...dto }),
    );
    const create = vi
      .spyOn(NotesApi, 'createNote')
      .mockResolvedValue({ id: CHILD_ID, title: 'Compose', createdAt: '2026-01-02' });
    renderPage('/note/n1');
    await editorFocused();
    const editor = editorOf(screen.getByLabelText('Note content'));

    act(() => {
      editor.commands.focus('end');
      typeText(editor, ' /subpage');
    });
    expect(await screen.findByRole('option', { name: /Sub-note/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    act(() => {
      press(editor, 'Enter');
    });
    await userEvent.type(await screen.findByPlaceholderText('Page title...'), 'Compose');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(create.mock.calls[0][0]).toEqual({ title: 'Compose', content: '', parentId: 'n1' }),
    );
    expect(await screen.findByRole('button', { name: 'Compose' })).toBeInTheDocument();
  });

  it('says when the note does not exist', async () => {
    vi.spyOn(NotesApi, 'getNote').mockResolvedValue(null as never);
    renderPage('/note/n1');

    expect(await screen.findByText('Note not found')).toBeInTheDocument();
  });

  // Known defect D8 (docs/testing/unit-test-audit.md): a failed load (404 for a deleted note,
  // network error) is thrown by useSuspenseQuery and no error boundary catches it, so the whole
  // app unmounts. Remove `.fails` once fixed.
  it.fails('shows an error instead of a blank page when the note cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(NotesApi, 'getNote').mockRejectedValue(new ApiError(404, 'Note not found'));
    renderPage('/note/n1');

    expect(await screen.findByText(/Note not found/)).toBeInTheDocument();
  });
});

describe('NoteEditPage — creating', () => {
  it('creates the note on the first autosave and opens it', async () => {
    const create = vi
      .spyOn(NotesApi, 'createNote')
      .mockResolvedValue({ ...NOTE, id: 'new-id', title: 'Fresh' });
    vi.spyOn(NotesApi, 'getNote').mockResolvedValue({ ...NOTE, id: 'new-id', title: 'Fresh' });
    renderPage('/note');

    expect(screen.getByText('Create Note')).toBeInTheDocument();
    await typeTitle('Fresh');

    await waitFor(() => expect(create).toHaveBeenCalled(), { timeout: 3000 });
    expect(create.mock.calls[0][0]).toEqual({ title: 'Fresh', content: '' });
    expect(await screen.findByText('Edit Note')).toBeInTheDocument();
  });

  // Known defect D4: autosave keeps firing while the create request is in flight, and every
  // save of the create page is a new POST, so slow responses produce duplicate notes.
  // Remove `.fails` once fixed.
  it.fails('creates the note only once while the first save is still in flight', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const create = vi.spyOn(NotesApi, 'createNote').mockReturnValue(new Promise(() => {}));
    renderPage('/note');
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    await editorFocused();
    await user.type(await titleInput(), 'A');
    await act(() => vi.advanceTimersByTimeAsync(1600));
    await user.type(await titleInput(), 'B');
    await act(() => vi.advanceTimersByTimeAsync(1600));

    expect(create).toHaveBeenCalledOnce();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Editor } from '@tiptap/react';
import { RichEditor, useRichEditorContext } from '@shared/ui/RichEditor';
import { getEditorMarkdown } from '@shared/lib/editor/markdown';
import { renderWithProviders } from '@shared/lib/test/render';
import { PageReferenceNode } from '../lib/tiptap/PageReferenceNode';
import { NoteEditorContext, useNoteEditorContext } from '../model/NoteEditorContext';
import { DeleteNoteAction } from './DeleteNoteAction/DeleteNoteAction';
import { NestedNoteCreator } from './NestedNoteCreator/NestedNoteCreator';
import { NoteEditorForm } from './NoteEditorForm/NoteEditorForm';

const NOTE_ID = '11111111-2222-3333-4444-555555555555';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NestedNoteCreator', () => {
  const setup = (
    request = vi.fn(() => Promise.resolve({ id: NOTE_ID, title: 'Child' })),
    isOpen = true,
  ) => {
    const onClose = vi.fn();
    const commitEditorState = vi.fn();
    const onNavigate = vi.fn();
    let editor: Editor | null = null;
    const Capture = () => {
      editor = useRichEditorContext().editor;
      return null;
    };

    renderWithProviders(
      <NoteEditorContext.Provider value={{ commitEditorState }}>
        <RichEditor.Root
          value="Parent text"
          onChange={vi.fn()}
          extensions={[PageReferenceNode.configure({ onPageNavigateRequest: onNavigate })]}
        >
          <RichEditor.Content />
          <Capture />
          <NestedNoteCreator
            isOpen={isOpen}
            onClose={onClose}
            onNestedNoteCreateRequest={request}
          />
        </RichEditor.Root>
      </NoteEditorContext.Provider>,
    );
    return { request, onClose, commitEditorState, onNavigate, editor: () => editor! };
  };

  it('creates the sub-note, links it in the parent and saves the parent right away', async () => {
    const { request, onClose, commitEditorState, editor } = setup();
    await waitFor(() => expect(editor()).not.toBeNull());

    await userEvent.type(screen.getByPlaceholderText('Page title...'), 'Child');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(request).toHaveBeenCalledWith('Child');
    const markdown = getEditorMarkdown(editor());
    expect(markdown).toContain(`[Child](/notes/${NOTE_ID})`);
    expect(commitEditorState).toHaveBeenCalledWith(markdown);
  });

  it('opens the linked sub-note from the parent', async () => {
    const { onNavigate, editor } = setup(undefined, false);
    await waitFor(() => expect(editor()).not.toBeNull());
    act(() => {
      editor().commands.insertPageReference({ noteId: NOTE_ID, title: 'Child' });
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Child' }));

    expect(onNavigate).toHaveBeenCalledWith(NOTE_ID);
  });

  it('does nothing for a blank title', async () => {
    const { request, editor } = setup();
    await waitFor(() => expect(editor()).not.toBeNull());

    await userEvent.type(screen.getByPlaceholderText('Page title...'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(request).not.toHaveBeenCalled();
  });

  it('shows the error and keeps the dialog open when creating fails', async () => {
    const { onClose, commitEditorState, editor } = setup(
      vi.fn(() => Promise.reject(new Error('Parent not found'))),
    );
    await waitFor(() => expect(editor()).not.toBeNull());

    await userEvent.type(screen.getByPlaceholderText('Page title...'), 'Child');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Parent not found')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(commitEditorState).not.toHaveBeenCalled();
  });

  it('closes on Cancel without creating anything', async () => {
    const { request, onClose } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });
});

/** The editor focuses itself after mounting; typing before that would land in the note body. */
const editorFocused = () =>
  waitFor(() => expect(screen.getByLabelText('Note content')).toHaveFocus());

describe('NoteEditorForm', () => {
  const props = {
    initialTitle: 'Docker',
    initialContent: '# Docker',
    onSave: vi.fn(),
    isSaving: false,
  };

  beforeEach(() => {
    props.onSave = vi.fn();
  });

  it('shows the title and the markdown content', async () => {
    const { container } = renderWithProviders(<NoteEditorForm {...props} />);

    expect(screen.getByPlaceholderText('Note Title')).toHaveValue('Docker');
    await waitFor(() => expect(container.querySelector('h1')).toHaveTextContent('Docker'));
  });

  it.each([
    [{ isSaving: true }, 'Saving...'],
    [{ saveError: 'Server down' }, 'Error: Server down'],
  ])('shows the save status %j', (status, text) => {
    renderWithProviders(<NoteEditorForm {...props} {...status} />);

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('marks unsaved changes while typing the title, then saves them', async () => {
    renderWithProviders(<NoteEditorForm {...props} />);
    await editorFocused();

    await userEvent.type(screen.getByPlaceholderText('Note Title'), '!');

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    await waitFor(() => expect(props.onSave).toHaveBeenCalled(), { timeout: 3000 });
    expect(props.onSave).toHaveBeenLastCalledWith({ title: 'Docker!', content: '# Docker' });
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('does not put a new line into the title on Enter', async () => {
    renderWithProviders(<NoteEditorForm {...props} />);
    await editorFocused();

    await userEvent.type(screen.getByPlaceholderText('Note Title'), '{Enter}');

    expect(screen.getByPlaceholderText('Note Title')).toHaveValue('Docker');
  });

  it('renders overlays inside the editor', () => {
    renderWithProviders(<NoteEditorForm {...props} editorOverlays={<p>Overlay</p>} />);

    expect(screen.getByText('Overlay')).toBeInTheDocument();
  });
});

describe('useNoteEditorContext', () => {
  it('fails loudly outside NoteEditorForm', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useNoteEditorContext())).toThrow(/within a NoteEditorForm/);
  });
});

describe('DeleteNoteAction', () => {
  // Placeholder action: it is wired into the page but only logs (see audit finding D5).
  it('renders an accessible delete button', () => {
    renderWithProviders(<DeleteNoteAction noteId="n1" />);

    expect(screen.getByRole('button', { name: 'Delete note' })).toBeInTheDocument();
  });
});

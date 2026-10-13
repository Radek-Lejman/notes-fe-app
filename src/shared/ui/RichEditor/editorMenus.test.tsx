import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LuStar } from 'react-icons/lu';
import { getEditorMarkdown } from '../../lib/editor/markdown';
import { NoteLinkSuggestion } from '../../lib/editor/extensions/NoteLinkSuggestion';
import type { NoteLinkTarget } from './NoteLink/types';
import { RichEditor } from './index';
import { press, renderEditor, select, typeText } from './editorTestHarness';

const DOCKER = { id: '11111111-1111-1111-1111-111111111111', title: 'Docker', path: 'DevOps' };
const DOCKER_COMPOSE = { id: '22222222-2222-2222-2222-222222222222', title: 'Docker Compose' };
const NEW_ID = '33333333-3333-3333-3333-333333333333';

afterEach(() => {
  vi.restoreAllMocks();
});

const slashMenu = () => screen.findByRole('listbox', { name: 'Insert block' });
const options = (listbox: HTMLElement) =>
  within(listbox)
    .getAllByRole('option')
    .map((option) => option.textContent ?? '');

describe('slash menu', () => {
  it('opens on "/" with the blocks in groups', async () => {
    const { editor } = await renderEditor('');

    act(() => typeText(editor, '/'));

    const menu = await slashMenu();
    expect(within(menu).getByText('Basic blocks')).toBeInTheDocument();
    expect(within(menu).getByText('Lists')).toBeInTheDocument();
    expect(within(menu).getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('filters by the typed query and runs the chosen block', async () => {
    const { editor } = await renderEditor('');

    act(() => typeText(editor, '/h2'));
    await waitFor(async () => expect(options(await slashMenu())[0]).toMatch(/^Heading 2/));
    act(() => {
      press(editor, 'Enter');
    });
    act(() => typeText(editor, 'Setup'));

    expect(getEditorMarkdown(editor)).toBe('## Setup');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('moves the selection with the arrow keys, wrapping around', async () => {
    const { editor } = await renderEditor('');
    act(() => typeText(editor, '/'));
    const menu = await slashMenu();
    const all = within(menu).getAllByRole('option');

    act(() => {
      press(editor, 'ArrowUp');
    });

    expect(all.at(-1)).toHaveAttribute('aria-selected', 'true');
    act(() => {
      press(editor, 'ArrowDown');
    });
    expect(all[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('closes on Escape and keeps the typed text', async () => {
    const { editor } = await renderEditor('');
    act(() => typeText(editor, '/quo'));
    await slashMenu();

    act(() => {
      press(editor, 'Escape');
    });

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(getEditorMarkdown(editor)).toBe('/quo');
  });

  it('says when no block matches', async () => {
    const { editor } = await renderEditor('');

    act(() => typeText(editor, '/zzzz'));

    expect(await screen.findByText('No matching blocks')).toBeInTheDocument();
  });

  it('runs a block chosen with the mouse', async () => {
    const { editor } = await renderEditor('');
    act(() => typeText(editor, '/quote'));

    await userEvent.click(within(await slashMenu()).getAllByRole('option')[0]);

    act(() => typeText(editor, 'Wise words'));
    expect(getEditorMarkdown(editor)).toBe('> Wise words');
  });

  it('lists custom items under "Notes" and runs their action', async () => {
    const action = vi.fn();
    const { editor } = await renderEditor('', {
      customSlashItems: [{ label: 'Star note', value: 'star', icon: LuStar, action }],
    });
    act(() => typeText(editor, '/'));
    const menu = await slashMenu();
    expect(within(menu).getByText('Notes')).toBeInTheDocument();

    act(() => typeText(editor, 'star'));
    await waitFor(async () => expect(options(await slashMenu())).toEqual(['Star note']));
    act(() => {
      press(editor, 'Enter');
    });

    expect(action).toHaveBeenCalledWith(editor);
    expect(getEditorMarkdown(editor)).toBe('');
  });

  it('offers Ask AI only when the editor has an AI handler', async () => {
    const withoutAi = await renderEditor('');
    act(() => typeText(withoutAi.editor, '/claude'));
    expect(await screen.findByText('No matching blocks')).toBeInTheDocument();
    withoutAi.unmount();

    const withAi = await renderEditor('', { onAskAi: vi.fn() });
    act(() => typeText(withAi.editor, '/claude'));
    await waitFor(async () => expect(options(await slashMenu())[0]).toMatch(/^Ask AI/));
  });

  it('does not open inside a code block', async () => {
    const { editor } = await renderEditor('```\ncode\n```');
    act(() => {
      select(editor, 5); // after "code", inside the block
      typeText(editor, ' /');
    });
    expect(getEditorMarkdown(editor)).toBe('```\ncode /\n```');

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('[[ note link picker', () => {
  const setup = async (
    notes: NoteLinkTarget[] = [DOCKER, DOCKER_COMPOSE],
    createNote: ((title: string) => Promise<NoteLinkTarget>) | null = vi.fn(() =>
      Promise.resolve({ id: NEW_ID, title: 'Kubernetes' }),
    ),
  ) => {
    const findNotes = vi.fn((query: string) =>
      notes.filter((n) => n.title.toLowerCase().includes(query.toLowerCase())),
    );
    const view = await renderEditor('', {
      extensions: [
        NoteLinkSuggestion.configure({ findNotes, createNote: createNote ?? undefined }),
      ],
    });
    return { ...view, findNotes, createNote };
  };
  const picker = () => screen.findByRole('listbox', { name: 'Link to note' });

  it('lists matching notes with where they live', async () => {
    const { editor, findNotes } = await setup();

    act(() => typeText(editor, '[[dock'));

    const list = await picker();
    await waitFor(() => expect(within(list).getAllByRole('option')).toHaveLength(3));
    expect(findNotes).toHaveBeenLastCalledWith('dock');
    expect(within(list).getByText('DevOps')).toBeInTheDocument();
    expect(within(list).getByText('Create note “dock”')).toBeInTheDocument();
  });

  it('inserts the chosen note as a link, followed by a space to keep typing', async () => {
    const { editor } = await setup();
    act(() => typeText(editor, '[[compose'));
    await waitFor(async () => expect(options(await picker())[0]).toBe('Docker Compose'));

    act(() => {
      press(editor, 'Enter');
    });

    expect(getEditorMarkdown(editor)).toBe(`[Docker Compose](/notes/${DOCKER_COMPOSE.id}) `);
  });

  it('does not offer to create a note whose title already exists', async () => {
    const { editor } = await setup();

    act(() => typeText(editor, '[[Docker'));

    await waitFor(async () => expect(options(await picker())).toHaveLength(2));
    expect(screen.queryByText(/Create note/)).not.toBeInTheDocument();
  });

  it('creates a missing note and links it', async () => {
    const { editor, createNote } = await setup([]);
    act(() => typeText(editor, '[[Kubernetes'));
    await waitFor(async () =>
      expect(options(await picker())).toEqual(['Create note “Kubernetes”']),
    );

    act(() => {
      press(editor, 'Enter');
    });

    expect(createNote).toHaveBeenCalledWith('Kubernetes');
    await waitFor(() => expect(getEditorMarkdown(editor)).toBe(`[Kubernetes](/notes/${NEW_ID}) `));
  });

  it('keeps the typed title as text when creating the note fails', async () => {
    const { editor } = await setup([], () => Promise.reject(new Error('offline')));
    act(() => typeText(editor, '[[Kubernetes'));
    await waitFor(async () => expect(options(await picker())).toHaveLength(1));

    act(() => {
      press(editor, 'Enter');
    });

    await waitFor(() => expect(getEditorMarkdown(editor)).toBe('Kubernetes'));
  });

  it('cannot create notes without a create handler', async () => {
    const { editor } = await setup([], null);

    act(() => typeText(editor, '[[Kubernetes'));

    expect(await screen.findByText('No notes found')).toBeInTheDocument();
  });

  it('asks to type when nothing was typed yet and there are no notes', async () => {
    const { editor } = await setup([]);

    act(() => typeText(editor, '[['));

    expect(await screen.findByText('Type to search your notes')).toBeInTheDocument();
  });

  it('shows at most 8 notes', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: `0000000${i}-0000-0000-0000-000000000000`.slice(-36),
      title: `Note ${i}`,
    }));
    const { editor } = await setup(many);

    act(() => typeText(editor, '[[note'));

    await waitFor(async () => expect(options(await picker())).toHaveLength(9)); // 8 + "Create"
  });
});

describe('status and shortcuts', () => {
  it('counts words as the note changes', async () => {
    const { editor } = await renderEditor('One', {}, <RichEditor.WordCount />);
    expect(await screen.findByText('1 word')).toBeInTheDocument();

    act(() => {
      editor.commands.insertContent(' two three');
    });

    expect(await screen.findByText('3 words')).toBeInTheDocument();
  });

  it('opens a searchable list of keyboard shortcuts', async () => {
    await renderEditor('', {}, <RichEditor.ShortcutsButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Bold')).toBeInTheDocument();

    await userEvent.type(within(dialog).getByLabelText('Search shortcuts'), 'ital');

    expect(within(dialog).getByText('Italic')).toBeInTheDocument();
    expect(within(dialog).queryByText('Bold')).not.toBeInTheDocument();
  });

  it('opens the shortcuts with Mod+/ and saves with Mod+S', async () => {
    const onSave = vi.fn();
    const { editor } = await renderEditor('', { onSave });

    act(() => {
      press(editor, 's', { ctrlKey: true });
      press(editor, '/', { ctrlKey: true });
    });

    expect(onSave).toHaveBeenCalledOnce();
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});

describe('RichEditor.Title', () => {
  it('reports changes and calls onEnter instead of adding a line', async () => {
    const onChange = vi.fn();
    const onEnter = vi.fn();
    await renderEditor('', {}, <RichEditor.Title value="" onChange={onChange} onEnter={onEnter} />);

    await userEvent.type(screen.getByPlaceholderText('Title'), 'A{Enter}');

    expect(onChange).toHaveBeenCalledWith('A');
    expect(onEnter).toHaveBeenCalledOnce();
  });
});

describe('placeholders', () => {
  it('shows the configured placeholder in an empty note', async () => {
    const { container } = await renderEditor('', { placeholder: 'Start writing' });

    await waitFor(() =>
      expect(container.querySelector('[data-placeholder]')).toHaveAttribute(
        'data-placeholder',
        'Start writing',
      ),
    );
  });

  it('names empty headings by level', async () => {
    const { container, editor } = await renderEditor('# ');
    act(() => {
      editor.commands.setContent('<h2></h2>');
      select(editor, 1);
    });

    await waitFor(() =>
      expect(container.querySelector('h2')).toHaveAttribute('data-placeholder', 'Heading 2'),
    );
  });
});

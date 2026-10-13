import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { NotesApi, noteKeys, type Notes } from '@entities/notes';
import { AiChatApi } from '@entities/ai-chat';
import { renderHookWithProviders } from '@shared/lib/test/render';
import { useEditorIntegrations } from './useEditorIntegrations';
import { useNestedNotePlugin } from './useNestedNotePlugin';

const note = (id: string, title: string, parentId: string | null = null): Notes => ({
  id,
  title,
  parentId,
  createdAt: '2026-01-01',
});

// a > b > c > d > e: a deep chain to check the path is capped.
const notes = [
  note('a', 'Projects'),
  note('b', 'AI', 'a'),
  note('c', '', 'b'),
  note('d', 'RAG', 'c'),
  note('e', 'Chunking', 'd'),
  note('f', 'Docker'),
];

const setup = (currentNoteId?: string) => {
  const view = renderHookWithProviders(
    (props: { currentNoteId?: string }) => useEditorIntegrations(props),
    { initialProps: { currentNoteId } },
  );
  view.queryClient.setQueryData(noteKeys.notes.list(), notes);
  const options = () => view.result.current.extensions[0].options;
  return { ...view, options };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useEditorIntegrations — [[ note links', () => {
  it('searches the cached note list without another request', async () => {
    const getNotes = vi.spyOn(NotesApi, 'getNotes');
    const { options } = setup();

    const found = await options().findNotes('dock');

    expect(found).toEqual([{ id: 'f', title: 'Docker', label: 'Docker', path: undefined }]);
    expect(getNotes).not.toHaveBeenCalled();
  });

  it('loads the note list when it is not cached yet', async () => {
    const getNotes = vi.spyOn(NotesApi, 'getNotes').mockResolvedValue([note('x', 'Fresh')]);
    const { options, queryClient } = setup();
    queryClient.removeQueries({ queryKey: noteKeys.notes.list() });

    await expect(options().findNotes('fresh')).resolves.toMatchObject([{ id: 'x' }]);
    expect(getNotes).toHaveBeenCalledOnce();
  });

  it('shows where a note lives, at most three levels up, naming untitled parents', async () => {
    const { options } = setup();

    const [hit] = await options().findNotes('chunking');

    expect(hit).toMatchObject({ id: 'e', path: 'AI / Untitled / RAG' });
  });

  it('labels untitled notes', async () => {
    const { options } = setup();

    const all = await options().findNotes('');

    expect(all.find((n) => n.id === 'c')).toMatchObject({ title: '', label: 'Untitled' });
  });

  it('leaves the edited note out, also after switching notes', async () => {
    const { options, rerender } = setup('f');
    expect((await options().findNotes('')).map((n) => n.id)).not.toContain('f');

    rerender({ currentNoteId: 'a' });

    const ids = (await options().findNotes('')).map((n) => n.id);
    expect(ids).toContain('f');
    expect(ids).not.toContain('a');
  });

  it('creates a linked note with an empty body', async () => {
    const createNote = vi
      .spyOn(NotesApi, 'createNote')
      .mockResolvedValue(note('new', 'Kubernetes'));
    const { options } = setup();

    await expect(options().createNote!('Kubernetes')).resolves.toEqual({
      id: 'new',
      title: 'Kubernetes',
    });
    expect(createNote.mock.calls[0][0]).toEqual({ title: 'Kubernetes', content: '' });
  });

  it('keeps the same extension instance across renders (the editor reads it once)', () => {
    const { result, rerender } = setup();
    const first = result.current.extensions;

    rerender({ currentNoteId: 'b' });

    expect(result.current.extensions).toBe(first);
  });
});

describe('useEditorIntegrations — Ask AI', () => {
  it('returns the assistant answer as markdown', async () => {
    const assist = vi
      .spyOn(AiChatApi, 'assist')
      .mockResolvedValue({ text: '**Better**', provider: 'claude', durationMs: 1 });
    const { result } = setup();
    const signal = new AbortController().signal;

    await expect(result.current.askAi({ action: 'improve', text: 'bad' }, signal)).resolves.toBe(
      '**Better**',
    );
    expect(assist).toHaveBeenCalledWith({ action: 'improve', text: 'bad' }, signal);
  });
});

describe('useNestedNotePlugin', () => {
  it('adds the page reference node and a "Sub-note" slash item that opens the dialog', () => {
    const { result } = renderHookWithProviders(() => useNestedNotePlugin());

    expect(result.current.extensions.map((e) => e.name)).toEqual(['pageReference']);
    expect(result.current.slashMenuItems).toMatchObject([{ label: 'Sub-note' }]);
    expect(result.current.isOverlayOpen).toBe(false);

    act(() => result.current.slashMenuItems[0].action?.(null as never));
    expect(result.current.isOverlayOpen).toBe(true);

    act(() => result.current.closeOverlay());
    expect(result.current.isOverlayOpen).toBe(false);
  });

  it('hides the slash item when creating sub-notes is disabled', () => {
    const { result } = renderHookWithProviders(() =>
      useNestedNotePlugin({ isNestedNoteCreationEnabled: false }),
    );

    expect(result.current.slashMenuItems).toEqual([]);
  });

  it('passes the navigation callback to the node', () => {
    const navigate = vi.fn();
    const { result } = renderHookWithProviders(() =>
      useNestedNotePlugin({ onNestedNoteNavigateRequest: navigate }),
    );

    expect(result.current.extensions[0].options).toMatchObject({
      onPageNavigateRequest: navigate,
    });
  });
});

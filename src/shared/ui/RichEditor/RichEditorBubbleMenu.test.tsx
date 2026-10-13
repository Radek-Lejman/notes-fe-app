import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Editor } from '@tiptap/react';
import { getEditorMarkdown } from '../../lib/editor/markdown';
import { RichEditor } from './index';
import { press, renderEditor, select } from './editorTestHarness';

const NOTE_ID = '11111111-2222-3333-4444-555555555555';

/** Renders the editor with its selection menu and selects `from..to` like a finished drag. */
const withSelection = async (markdown: string, from: number, to: number, props = {}) => {
  const view = await renderEditor(markdown, props, <RichEditor.BubbleMenu />);
  act(() => {
    view.editor.commands.focus();
    select(view.editor, from, to);
  });
  return view;
};

const toolbar = () => screen.findByRole('toolbar', { name: 'Formatting' });
const markdownOf = (editor: Editor) => getEditorMarkdown(editor);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('selection menu — formatting', () => {
  it('formats the selected text', async () => {
    const { editor } = await withSelection('Docker uses containers.', 1, 7);

    await userEvent.click(within(await toolbar()).getByRole('button', { name: 'Bold' }));
    expect(markdownOf(editor)).toBe('**Docker** uses containers.');

    await userEvent.click(within(await toolbar()).getByRole('button', { name: 'Italic' }));
    expect(markdownOf(editor)).toBe('***Docker*** uses containers.');
  });

  it('shows which marks are active', async () => {
    await withSelection('**Docker** uses containers.', 1, 7);

    const bold = within(await toolbar()).getByRole('button', { name: 'Bold' });
    expect(bold).toHaveAttribute('aria-pressed', 'true');
    expect(within(await toolbar()).getByRole('button', { name: 'Italic' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('turns the block into another type', async () => {
    const { editor } = await withSelection('Docker uses containers.', 1, 7);

    const turnInto = within(await toolbar()).getByRole('button', { name: /Text/ });
    await userEvent.click(turnInto);
    await userEvent.click(await screen.findByRole('menuitem', { name: /Heading 1/ }));

    expect(markdownOf(editor)).toBe('# Docker uses containers.');
  });

  it('keeps rare actions under More', async () => {
    const { editor } = await withSelection('Docker uses containers.', 1, 7);

    await userEvent.click(within(await toolbar()).getByRole('button', { name: 'More' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Strikethrough/ }));

    expect(markdownOf(editor)).toBe('~~Docker~~ uses containers.');
  });

  it('offers Ask AI only when the editor has an AI handler', async () => {
    const plain = await withSelection('Docker', 1, 7);
    expect(within(await toolbar()).queryByRole('button', { name: /AI/ })).not.toBeInTheDocument();
    plain.unmount();

    await withSelection('Docker', 1, 7, { onAskAi: vi.fn() });
    await userEvent.click(within(await toolbar()).getByRole('button', { name: /AI/ }));

    expect(await screen.findByLabelText('Instruction for AI')).toBeInTheDocument();
  });
});

describe('selection menu — links', () => {
  it('links the selection from the link editor (Mod+K)', async () => {
    const { editor } = await withSelection('Docker uses containers.', 1, 7);

    act(() => {
      press(editor, 'k', { ctrlKey: true });
    });
    await userEvent.type(await screen.findByLabelText('Link URL'), 'docs.docker.com{Enter}');

    expect(markdownOf(editor)).toBe('[Docker](https://docs.docker.com) uses containers.');
  });

  it('closes the link editor on Escape without linking', async () => {
    const { editor } = await withSelection('Docker uses containers.', 1, 7);
    act(() => {
      press(editor, 'k', { ctrlKey: true });
    });

    await userEvent.type(await screen.findByLabelText('Link URL'), 'x{Escape}');

    await waitFor(() => expect(screen.queryByLabelText('Link URL')).not.toBeInTheDocument());
    expect(markdownOf(editor)).toBe('Docker uses containers.');
  });

  it('previews a web link under the caret and removes it', async () => {
    const { editor } = await withSelection('[Docker](https://docker.com) rocks', 3, 3);

    const link = await screen.findByRole('link', { name: 'https://docker.com' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    await userEvent.click(screen.getByRole('button', { name: 'Remove link' }));
    expect(markdownOf(editor)).toBe('Docker rocks');
  });

  it('opens a link to another note inside the app', async () => {
    const onOpenNote = vi.fn();
    await withSelection(`See [Docker](/notes/${NOTE_ID}) here`, 7, 7, { onOpenNote });

    expect(await screen.findByText('Link to a note')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open note' }));

    expect(onOpenNote).toHaveBeenCalledWith(NOTE_ID);
  });

  it('opens a note link in a new tab when the app gives no handler', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    await withSelection(`See [Docker](/notes/${NOTE_ID}) here`, 7, 7);

    await userEvent.click(await screen.findByRole('button', { name: 'Open note' }));

    expect(open).toHaveBeenCalledWith(`/note/${NOTE_ID}`, '_blank', 'noopener,noreferrer');
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Editor } from '@tiptap/react';
import { getEditorMarkdown } from '../../lib/editor/markdown';
import { renderWithProviders } from '../../lib/test/render';
import { MarkdownView } from '../MarkdownView';
import { AiPanel } from './AiPanel';
import { renderEditor, select } from './editorTestHarness';
import type { AskAi } from './types';

const NOTE = 'Docker uses containers.\n\nSecond paragraph.';

/** Opens Ask AI on the range (a selection, or the caret when `to` is left out). */
const openPanel = async (askAi: AskAi, from: number, to = from, markdown = NOTE) => {
  const { editor } = await renderEditor(markdown, { onAskAi: askAi });
  act(() => {
    select(editor, from, to);
    editor.commands.openAiPanel();
  });
  renderWithProviders(<AiPanel editor={editor} askAi={askAi} />);
  return editor;
};

const aiRange = (editor: Editor) => editor.storage.editorUi.aiRange;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AiPanel — on a selection', () => {
  it('offers the rewrite actions for the selected text', async () => {
    await openPanel(vi.fn(), 1, 7);

    expect(screen.getByText('on the selected text')).toBeInTheDocument();
    for (const label of ['Improve writing', 'Fix spelling & grammar', 'Summarize', 'Explain']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: 'Continue writing' })).not.toBeInTheDocument();
  });

  it('sends the selection, shows the answer and replaces the selection with it', async () => {
    const askAi = vi.fn<AskAi>(() => Promise.resolve('**Podman**'));
    const editor = await openPanel(askAi, 1, 7);

    await userEvent.click(screen.getByRole('button', { name: 'Improve writing' }));

    expect(askAi).toHaveBeenCalledWith(
      { action: 'improve', text: 'Docker' },
      expect.any(AbortSignal),
    );
    await userEvent.click(await screen.findByRole('button', { name: /Replace selection/ }));
    expect(getEditorMarkdown(editor)).toBe('**Podman** uses containers.\n\nSecond paragraph.');
    expect(aiRange(editor)).toBeNull();
  });

  it('inserts the answer below the selected block', async () => {
    const editor = await openPanel(() => Promise.resolve('A summary.'), 1, 7);

    await userEvent.click(screen.getByRole('button', { name: 'Summarize' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Insert below' }));

    expect(getEditorMarkdown(editor)).toBe(
      'Docker uses containers.\n\nA summary.\n\nSecond paragraph.',
    );
  });

  it('sends a custom instruction', async () => {
    const askAi = vi.fn<AskAi>(() => Promise.resolve('Docker'));
    await openPanel(askAi, 1, 7);

    await userEvent.type(screen.getByLabelText('Instruction for AI'), '  make it bold  {Enter}');

    expect(askAi).toHaveBeenCalledWith(
      { action: 'custom', instruction: 'make it bold', text: 'Docker' },
      expect.any(AbortSignal),
    );
  });

  it('cannot send an empty instruction', async () => {
    await openPanel(vi.fn(), 1, 7);

    expect(screen.getByRole('button', { name: 'Ask AI' })).toBeDisabled();
  });

  it('discards the answer without changing the note', async () => {
    const editor = await openPanel(() => Promise.resolve('Other'), 1, 7);

    await userEvent.click(screen.getByRole('button', { name: 'Explain' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));

    expect(getEditorMarkdown(editor)).toBe(NOTE);
    expect(aiRange(editor)).toBeNull();
  });

  it('asks again for another answer', async () => {
    const askAi = vi.fn<AskAi>().mockResolvedValueOnce('First').mockResolvedValueOnce('Second');
    await openPanel(askAi, 1, 7);

    await userEvent.click(screen.getByRole('button', { name: 'Translate' }));
    await screen.findByText('First');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Second')).toBeInTheDocument();
    expect(askAi).toHaveBeenCalledTimes(2);
    expect(askAi.mock.calls[1][0]).toEqual(askAi.mock.calls[0][0]);
  });
});

describe('AiPanel — at the cursor', () => {
  it('continues writing from the text before the cursor', async () => {
    const askAi = vi.fn<AskAi>(() => Promise.resolve('More text.'));
    const editor = await openPanel(askAi, 24);

    expect(screen.getByText('at the cursor')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continue writing' }));

    expect(askAi.mock.calls[0][0]).toEqual({
      action: 'continue',
      text: 'Docker uses containers.',
    });
    await userEvent.click(await screen.findByRole('button', { name: /Insert/ }));
    expect(getEditorMarkdown(editor)).toBe(
      'Docker uses containers.More text.\n\nSecond paragraph.',
    );
  });

  it('explains that an empty note has nothing to continue', async () => {
    const askAi = vi.fn<AskAi>();
    await openPanel(askAi, 1, 1, '');

    await userEvent.click(screen.getByRole('button', { name: 'Continue writing' }));

    expect(screen.getByText('There is no text to work with yet.')).toBeInTheDocument();
    expect(askAi).not.toHaveBeenCalled();
  });

  it('still allows writing from an instruction in an empty note', async () => {
    const askAi = vi.fn<AskAi>(() => Promise.resolve('# Plan'));
    await openPanel(askAi, 1, 1, '');

    await userEvent.type(screen.getByLabelText('Instruction for AI'), 'Write a plan{Enter}');

    expect(askAi).toHaveBeenCalledWith(
      { action: 'custom', instruction: 'Write a plan', text: undefined },
      expect.any(AbortSignal),
    );
  });
});

describe('AiPanel — errors and cancelling', () => {
  it('shows the error and retries the same request', async () => {
    const askAi = vi
      .fn<AskAi>()
      .mockRejectedValueOnce(new Error('AI is busy'))
      .mockResolvedValueOnce('Fixed');
    await openPanel(askAi, 1, 7);

    await userEvent.click(screen.getByRole('button', { name: 'Fix spelling & grammar' }));
    expect(await screen.findByText('AI is busy')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Fixed')).toBeInTheDocument();
  });

  it('shows a generic message for non-Error failures', async () => {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- the case under test
    await openPanel(() => Promise.reject('nope'), 1, 7);

    await userEvent.click(screen.getByRole('button', { name: 'Explain' }));

    expect(await screen.findByText('Ask AI failed. Try again.')).toBeInTheDocument();
  });

  it('cancels a running request and closes the panel', async () => {
    let signal: AbortSignal | undefined;
    const editor = await openPanel(
      (_request, s) => {
        signal = s;
        return new Promise(() => {});
      },
      1,
      7,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Explain' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(signal?.aborted).toBe(true);
    expect(aiRange(editor)).toBeNull();
  });

  it('closes on Escape', async () => {
    const editor = await openPanel(vi.fn(), 1, 7);

    await userEvent.type(screen.getByLabelText('Instruction for AI'), '{Escape}');

    expect(aiRange(editor)).toBeNull();
  });

  it('closes and aborts on a click outside the panel and the editor', async () => {
    let signal: AbortSignal | undefined;
    const editor = await openPanel(
      (_request, s) => {
        signal = s;
        return new Promise(() => {});
      },
      1,
      7,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Explain' }));

    await userEvent.click(document.body);

    await waitFor(() => expect(aiRange(editor)).toBeNull());
    expect(signal?.aborted).toBe(true);
  });

  it('ignores an answer that arrives after cancelling', async () => {
    let resolve!: (answer: string) => void;
    await openPanel(() => new Promise((r) => (resolve = r)), 1, 7);

    await userEvent.click(screen.getByRole('button', { name: 'Explain' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await act(() => {
      resolve('Too late');
      return Promise.resolve();
    });

    expect(screen.queryByText('Too late')).not.toBeInTheDocument();
  });
});

describe('MarkdownView', () => {
  it('renders markdown read-only and follows content changes', async () => {
    const { container, rerender } = renderWithProviders(<MarkdownView markdown="# Title" />);
    await waitFor(() => expect(container.querySelector('h1')).toHaveTextContent('Title'));
    expect(container.querySelector('[contenteditable="false"]')).toBeInTheDocument();

    rerender(<MarkdownView markdown={'# Title\n\n- item'} />);

    await waitFor(() => expect(container.querySelector('li')).toHaveTextContent('item'));
  });
});

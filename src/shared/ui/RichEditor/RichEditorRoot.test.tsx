import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import type { Editor } from '@tiptap/react';
import { RichEditorRoot } from './RichEditorRoot';
import { RichEditorContent } from './RichEditorContent';
import { useRichEditorContext } from './RichEditorContext';

afterEach(cleanup);

const renderEditor = async (value: string) => {
  const onChange = vi.fn<(markdown: string) => void>();
  let editor: Editor | null = null;
  const Capture = () => {
    editor = useRichEditorContext().editor;
    return null;
  };

  const view = render(
    <ChakraProvider value={defaultSystem}>
      <RichEditorRoot value={value} onChange={onChange}>
        <RichEditorContent />
        <Capture />
      </RichEditorRoot>
    </ChakraProvider>,
  );
  await waitFor(() => expect(editor).not.toBeNull());
  return { ...view, onChange, editor: editor as unknown as Editor };
};

describe('RichEditorRoot', () => {
  it('renders markdown as formatted content', async () => {
    const { container } = await renderEditor('# Docker\n\nNotatki o **kontenerach**.');

    await waitFor(() => expect(container.querySelector('h1')?.textContent).toBe('Docker'));
    expect(container.querySelector('strong')?.textContent).toBe('kontenerach');
  });

  it('does not report a change just for opening a note', async () => {
    const { onChange } = await renderEditor('- a\n- b\n\n```ts\nconst x = 1;\n```');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports edits as markdown', async () => {
    const { onChange, editor } = await renderEditor('# Docker');

    editor.commands.insertContentAt(editor.state.doc.content.size, {
      type: 'paragraph',
      content: [{ type: 'text', text: '1. not a list' }],
    });

    expect(onChange).toHaveBeenLastCalledWith('# Docker\n\n1\\. not a list');
  });

  it('reports an emptied note as an empty string', async () => {
    const { onChange, editor } = await renderEditor('# Docker');

    editor.commands.clearContent(true);

    expect(onChange).toHaveBeenLastCalledWith('');
  });
});

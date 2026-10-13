import { waitFor } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { expect, vi } from 'vitest';
import { renderWithProviders } from '../../lib/test/render';
import { RichEditor } from './index';
import { useRichEditorContext } from './RichEditorContext';
import type { RootProps } from './types';

/** Renders the note editor and hands back the Tiptap editor once it exists. */
export const renderEditor = async (
  value: string,
  props: Partial<Omit<RootProps, 'value' | 'children'>> = {},
  children: React.ReactNode = null,
) => {
  const onChange = vi.fn<(markdown: string) => void>();
  let editor: Editor | null = null;
  const Capture = () => {
    editor = useRichEditorContext().editor;
    return null;
  };

  const view = renderWithProviders(
    <RichEditor.Root value={value} onChange={onChange} {...props}>
      <RichEditor.Content />
      <Capture />
      {children}
    </RichEditor.Root>,
  );
  await waitFor(() => expect(editor).not.toBeNull());
  const ready = editor as unknown as Editor;
  // A new editor starts with everything selected; put the caret at the end like a click would.
  ready.commands.setTextSelection(ready.state.doc.content.size - 1);
  onChange.mockClear();
  return { ...view, onChange, editor: ready };
};

export { press, select, typeText } from '../../lib/test/editor';

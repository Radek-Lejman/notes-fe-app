import { EditorContent } from '@tiptap/react';
import { useRichEditorContext } from '.';

export const RichEditorContent = () => {
  const { editor } = useRichEditorContext();

  if (!editor) return null;

  return <EditorContent editor={editor} />;
};

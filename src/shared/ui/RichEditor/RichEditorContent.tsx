import { EditorContent } from "@tiptap/react";
import { useRichEditorContext } from "./RichEditorRoot";

export const RichEditorContent = () => {
  const { editor } = useRichEditorContext();

  if (!editor) return null;

  return <EditorContent editor={editor} />;
};

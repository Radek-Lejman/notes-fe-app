import { createContext, useContext, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyleKit } from "@tiptap/extension-text-style";
import styles from "./RichEditor.module.css";
import { SlashCommand } from "../../lib/editor/extensions/SlashCommand";
import { createSuggestionOptions } from "../../lib/editor/extensions/suggestion";
import { type RichEditorContextValue, type RootProps } from "./types";

const RichEditorContext = createContext<RichEditorContextValue | null>(null);

export const useRichEditorContext = () => {
  const context = useContext(RichEditorContext);
  if (!context) {
    throw new Error("RichEditor components must be used within a <RichEditor.Root>");
  }
  return context;
};

export const RichEditorRoot = ({
  value = {},
  onChange,
  autoFocus = false,
  placeholder = "Write something...",
  className = "",
  children,
  customSlashItems = [],
  extensions = [],
}: RootProps) => {
  const editor = useEditor({
    extensions: [
      ...extensions,
      TextStyleKit,
      StarterKit,
      Placeholder.configure({ placeholder }),
      SlashCommand.configure({
        suggestion: createSuggestionOptions(customSlashItems),
      }),
    ],
    content: value,
    editable: true,
    autofocus: autoFocus,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: styles.proseMirrorWrapper,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      onChange(editor.getJSON());
    };
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, onChange]);

  return (
    <RichEditorContext.Provider value={{ editor }}>
      <div className={`${styles.richEditor} ${className}`}>
        {children}
      </div>
    </RichEditorContext.Provider>
  );
};

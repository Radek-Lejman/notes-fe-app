import { createContext, useContext } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyleKit } from "@tiptap/extension-text-style";
import styles from "./RichEditor.module.css";
import { SlashCommand } from "../../lib/editor/extensions/SlashCommand";
import { suggestionOptionsAdapter } from "../../lib/editor/extensions/suggestion";
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
  value = "",
  onChange,
  autoFocus = false,
  placeholder = "Write something...",
  className = "",
  children,
}: RootProps) => {
  const editor = useEditor({
    extensions: [
      TextStyleKit,
      StarterKit,
      Placeholder.configure({ placeholder }),
      SlashCommand.configure({
        suggestion: suggestionOptionsAdapter,
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
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  return (
    <RichEditorContext.Provider value={{ editor }}>
      <div className={`${styles.richEditor} ${className}`}>
        {children}
      </div>
    </RichEditorContext.Provider>
  );
};

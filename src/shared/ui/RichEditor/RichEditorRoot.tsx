import React, { createContext, useContext } from "react";
import { Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyleKit } from "@tiptap/extension-text-style";
import styles from "./RichEditor.module.css";

interface RichEditorContextValue {
  editor: Editor | null;
}

const RichEditorContext = createContext<RichEditorContextValue | null>(null);

export const useRichEditorContext = () => {
  const context = useContext(RichEditorContext);
  if (!context) {
    throw new Error("RichEditor components must be used within a <RichEditor.Root>");
  }
  return context;
};

interface RootProps {
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  children: React.ReactNode;
}

export const RichEditorRoot = ({
  value = "",
  onChange,
  onEnter,
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
    ],
    content: value,
    editable: true,
    autofocus: autoFocus,
    immediatelyRender: false,
    editorProps: {
      handleKeyDown: (_, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          if (onEnter) {
            onEnter();
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
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

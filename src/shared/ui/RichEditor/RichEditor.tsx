import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Dropdown } from "../Menu/Menu";
import styles from "./RichEditor.module.css";
import { TextStyleKit } from "@tiptap/extension-text-style";

interface EditableProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  tag?: "p" | "h2";
}

const extensions = [TextStyleKit, StarterKit];

// TODO - ujednolicenie komponentow
// TODO - zrob koncepcje jak przetlumaczyc obecna strkture na BE
// TODO - do strukturyry FE + markdown + to ze mielibysmy wiele blokow (richEditorow)

// TODO z jakiegos powodu style sie nie aplikuja dedykowne dla danego tagu
export default function RichEditor({
  value = "",
  onChange,
  placeholder = "Write something...",
  tag = "p",
  className = "",
}: EditableProps) {
  const editor = useEditor({
    extensions,
    content: `x`,
    editable: true,
    autofocus: true,
  });

  // Synchronizacja gdy value zmienia się z zewnątrz (controlled)
  // useEffect(() => {
  //   if (!editor) return;

  //   const current = editor.getText();
  //   if (current !== value) {
  //     editor.commands.setContent(`x`, {
  //       emitUpdate: true,
  //     });
  //   }
  // }, [value, editor, tag]);

  if (!editor) return null;

  const handleEditorType = (editorType: string) => {
    if (!editor) return;

    switch (editorType) {
      case "bold":
        editor.chain().focus().toggleBold().run();
        break;

      case "italic":
        editor.chain().focus().toggleItalic().run();
        break;

      case "strike":
        editor.chain().focus().toggleStrike().run();
        break;

      case "code":
        editor.chain().focus().toggleCode().run();
        break;

      case "clearMarks":
        editor.chain().focus().unsetAllMarks().run();
        break;

      case "clearNodes":
        editor.chain().focus().clearNodes().run();
        break;

      case "paragraph":
        editor.chain().focus().setParagraph().run();
        break;

      case "h1":
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;

      case "h2":
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;

      case "h3":
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;

      case "h4":
        editor.chain().focus().toggleHeading({ level: 4 }).run();
        break;

      case "h5":
        editor.chain().focus().toggleHeading({ level: 5 }).run();
        break;

      case "h6":
        editor.chain().focus().toggleHeading({ level: 6 }).run();
        break;

      case "bulletList":
        editor.chain().focus().toggleBulletList().run();
        break;

      case "orderedList":
        editor.chain().focus().toggleOrderedList().run();
        break;

      case "codeBlock":
        editor.chain().focus().toggleCodeBlock().run();
        break;

      case "blockquote":
        editor.chain().focus().toggleBlockquote().run();
        break;

      case "horizontalRule":
        editor.chain().focus().setHorizontalRule().run();
        break;

      case "hardBreak":
        editor.chain().focus().setHardBreak().run();
        break;

      case "undo":
        editor.chain().focus().undo().run();
        break;

      case "redo":
        editor.chain().focus().redo().run();
        break;

      default:
        throw new Error("Unknown editor type: " + editorType);
    }
  };

  return (
    <div className={styles.richEditor}>
      <Dropdown onSelect={handleEditorType} />

      <EditorContent editor={editor} />
    </div>
  );
}

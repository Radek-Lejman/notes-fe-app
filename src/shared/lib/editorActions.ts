import { type Editor } from "@tiptap/core";

export const handleEditorAction = (editor: Editor, editorType: string | undefined) => {
  if (!editorType) return;
  
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

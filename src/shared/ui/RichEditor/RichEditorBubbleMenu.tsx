import { BubbleMenu } from "@tiptap/react/menus";
import { useRichEditorContext } from "./RichEditorRoot";
import { IconButton, Group } from "@chakra-ui/react";
import { MdFormatBold, MdFormatItalic, MdStrikethroughS, MdCode } from "react-icons/md";
import styles from "./RichEditor.module.css";

export const RichEditorBubbleMenu = () => {
  const { editor } = useRichEditorContext();

  if (!editor) return null;

  const handleIconVariant = (style: string) => {
    return editor.isActive(style) ? "solid" : "outline";
  }
  const handleIconColor = (style: string) => {
    return editor.isActive(style) ? "brand" : "gray";
  }

  return (
    <BubbleMenu
      editor={editor}
      className={styles.bubbleMenu}
    >
      <Group attached>
        <IconButton
          aria-label="Bold"
          size="sm"
          variant={handleIconVariant("bold")}
          colorScheme={handleIconColor("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <MdFormatBold />
        </IconButton>
        <IconButton
          aria-label="Italic"
          size="sm"
          variant={handleIconVariant("italic")}
          colorScheme={handleIconColor("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <MdFormatItalic />
        </IconButton>
        <IconButton
          aria-label="Strikethrough"
          size="sm"
          variant={handleIconVariant("strike")}
          colorScheme={handleIconColor("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <MdStrikethroughS />
        </IconButton>
        <IconButton
          aria-label="Code"
          size="sm"
          variant={handleIconVariant("code")}
          colorScheme={handleIconColor("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <MdCode />
        </IconButton>
      </Group>
    </BubbleMenu>
  );
};

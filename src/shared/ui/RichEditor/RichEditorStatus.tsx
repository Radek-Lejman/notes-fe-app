import { IconButton, Text } from '@chakra-ui/react';
import { useEditorState, type Editor } from '@tiptap/react';
import { LuKeyboard } from 'react-icons/lu';
import { EditorTooltip } from './EditorTooltip';
import { useRichEditorContext } from './RichEditorContext';

const WordCountText = ({ editor }: { editor: Editor }) => {
  const words = useEditorState({
    editor,
    selector: ({ editor: e }) => e.storage.characterCount.words(),
  });

  return (
    <Text fontSize="xs" color="fg.subtle" fontVariantNumeric="tabular-nums" userSelect="none">
      {words} {words === 1 ? 'word' : 'words'}
    </Text>
  );
};

export const RichEditorWordCount = () => {
  const { editor } = useRichEditorContext();
  if (!editor) return null;
  return <WordCountText editor={editor} />;
};

export const RichEditorShortcutsButton = () => {
  const { setShortcutsOpen } = useRichEditorContext();

  return (
    <EditorTooltip label="Keyboard shortcuts" shortcut="Mod-/">
      <IconButton
        aria-label="Keyboard shortcuts"
        size="xs"
        variant="ghost"
        color="fg.subtle"
        onClick={() => setShortcutsOpen(true)}
      >
        <LuKeyboard />
      </IconButton>
    </EditorTooltip>
  );
};

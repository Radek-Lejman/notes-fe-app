import { useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyleKit } from '@tiptap/extension-text-style';
import styles from './RichEditor.module.css';
import { SlashCommand } from '../../lib/editor/extensions/SlashCommand';
import { createSuggestionOptions } from '../../lib/editor/extensions/suggestion';
import { type RootProps } from './types';
import { RichEditorContext } from './RichEditorContext';

export const RichEditorRoot = ({
  value = {},
  onChange,
  autoFocus = false,
  placeholder = 'Write something...',
  className = '',
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
    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, onChange]);

  return (
    <RichEditorContext.Provider value={{ editor }}>
      <div className={`${styles.richEditor} ${className}`}>{children}</div>
    </RichEditorContext.Provider>
  );
};

import { useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import styles from './RichEditor.module.css';
import { useRichEditorContext } from './RichEditorContext';
import { RichEditorBlockHandle } from './RichEditorBlockHandle';
import { RichEditorMobileToolbar } from './RichEditorMobileToolbar';

export const RichEditorContent = () => {
  const { editor } = useRichEditorContext();
  const containerRef = useRef<HTMLDivElement>(null);

  if (!editor) return null;

  return (
    <div ref={containerRef} className={styles.richEditor}>
      <EditorContent editor={editor} />
      <RichEditorBlockHandle editor={editor} containerRef={containerRef} />
      <RichEditorMobileToolbar editor={editor} />
    </div>
  );
};

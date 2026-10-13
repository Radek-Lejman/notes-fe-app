import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { createMarkdownExtensions, SafeMarkdown } from '../../lib/editor/markdown';
import styles from './MarkdownView.module.css';

interface MarkdownViewProps {
  markdown: string;
  className?: string;
}

/** Read-only markdown rendered with the same extensions as the note editor. */
export const MarkdownView = ({ markdown, className = '' }: MarkdownViewProps) => {
  const editor = useEditor({
    extensions: [SafeMarkdown, ...createMarkdownExtensions()],
    content: markdown,
    contentType: 'markdown',
    editable: false,
    immediatelyRender: false,
  });

  // Content changes while an answer streams in.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.commands.setContent(markdown, { contentType: 'markdown', emitUpdate: false });
  }, [editor, markdown]);

  return <EditorContent editor={editor} className={`${styles.markdownView} ${className}`} />;
};

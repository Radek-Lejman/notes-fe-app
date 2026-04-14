import { useState, useEffect, useCallback } from 'react';
import type { JSONContent } from '@tiptap/react';
import { useAutoSave } from './useAutoSave';

export interface UseNoteFormProps {
  initialTitle: string;
  initialContent: JSONContent | null;
  onSave: (data: { title: string; content: JSONContent | null }) => void;
  debounceMs?: number;
}

export const useNoteForm = ({
  initialTitle,
  initialContent,
  onSave,
  debounceMs = 1500,
}: UseNoteFormProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<JSONContent | null>(initialContent);

  const { syncStatus, markDirty, markClean, forceCommit } = useAutoSave({
    onSave,
    debounceMs,
  });

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    markClean();
  }, [initialTitle, initialContent, markClean]);

  const handleContentChange = useCallback(
    (newContent: JSONContent) => {
      setContent(newContent);
      if (!title || !newContent) return;
      markDirty({ title, content: newContent });
    },
    [title, markDirty],
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (!newTitle || !content) return;
      markDirty({ title: newTitle, content });
    },
    [content, markDirty],
  );

  const commitEditorState = useCallback(
    (immediateContent?: JSONContent) => {
      const finalContent = immediateContent || content;
      if (!title || !finalContent) return;
      forceCommit({ title, content: finalContent });
    },
    [title, content, forceCommit],
  );

  return {
    title,
    content,
    syncStatus,
    handleContentChange,
    handleTitleChange,
    commitEditorState,
  };
};

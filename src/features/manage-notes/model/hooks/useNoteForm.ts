import { useState, useCallback } from 'react';
import { useAutoSave } from './useAutoSave';

export interface UseNoteFormProps {
  initialTitle: string;
  /** Markdown. */
  initialContent: string;
  onSave: (data: { title: string; content: string }) => void;
  debounceMs?: number;
}

export const useNoteForm = ({
  initialTitle,
  initialContent,
  onSave,
  debounceMs = 1500,
}: UseNoteFormProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  // Initial values are read once (the widget is keyed by note id). Re-applying them when the
  // saved note comes back would discard edits typed while the save was in flight.
  const { syncStatus, markDirty, forceCommit } = useAutoSave({
    onSave,
    debounceMs,
  });

  // Empty markdown is a valid note body; only a missing title blocks saving.
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      if (!title) return;
      markDirty({ title, content: newContent });
    },
    [title, markDirty],
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (!newTitle) return;
      markDirty({ title: newTitle, content });
    },
    [content, markDirty],
  );

  const commitEditorState = useCallback(
    (immediateContent?: string) => {
      if (!title) return;
      forceCommit({ title, content: immediateContent ?? content });
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

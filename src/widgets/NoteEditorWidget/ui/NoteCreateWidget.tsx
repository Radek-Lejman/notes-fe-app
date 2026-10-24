import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { noteKeys, useCreateNote, useUpdateNote, type Notes } from '@entities/notes';
import { NoteEditorForm, useEditorIntegrations } from '@features/manage-notes';
import { useNavigate } from 'react-router-dom';
import type { NoteCreateWidgetProps } from '../model/types';

type NoteDraft = { title: string; content: string };

export const NoteCreateWidget = ({ onNoteCreated }: NoteCreateWidgetProps) => {
  const client = useQueryClient();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const integrations = useEditorIntegrations();
  const navigate = useNavigate();

  // Autosave keeps firing while the POST is in flight; a second POST would create a duplicate
  // note (D4). Later saves wait here and go to the created note as an update.
  const isCreatingRef = useRef(false);
  const pendingDraftRef = useRef<NoteDraft | null>(null);

  const handleSave = (data: NoteDraft) => {
    if (isCreatingRef.current) {
      pendingDraftRef.current = data;
      return;
    }

    isCreatingRef.current = true;
    createNote.mutate(
      { title: data.title, content: data.content },
      {
        onSuccess: (newNote) => {
          const pending = pendingDraftRef.current;
          pendingDraftRef.current = null;
          if (pending) {
            // The edit page reads its initial values from this cache entry, so it opens with the
            // latest text instead of what the first save sent.
            client.setQueryData<Notes>(noteKeys.notes.detail(newNote.id), {
              ...newNote,
              ...pending,
            });
            updateNote.mutate({ id: newNote.id, ...pending });
          }
          onNoteCreated(newNote.id);
        },
        onError: () => {
          // Nothing was created: the next save tries again with the whole form.
          isCreatingRef.current = false;
          pendingDraftRef.current = null;
        },
      },
    );
  };

  return (
    <NoteEditorForm
      initialTitle=""
      initialContent=""
      onSave={handleSave}
      isSaving={createNote.isPending}
      saveError={createNote.error ? createNote.error.message || 'Server connection error' : null}
      editorExtensions={integrations.extensions}
      onOpenNote={(id) => void navigate(`/note/${id}`)}
      onAskAi={integrations.askAi}
    />
  );
};

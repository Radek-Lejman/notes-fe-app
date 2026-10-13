import { useCreateNote } from '@entities/notes';
import { NoteEditorForm, useEditorIntegrations } from '@features/manage-notes';
import { useNavigate } from 'react-router-dom';
import type { NoteCreateWidgetProps } from '../model/types';

export const NoteCreateWidget = ({ onNoteCreated }: NoteCreateWidgetProps) => {
  const createNote = useCreateNote();
  const integrations = useEditorIntegrations();
  const navigate = useNavigate();

  const handleSave = (data: { title: string; content: string }) => {
    createNote.mutate(
      { title: data.title, content: data.content },
      {
        onSuccess: (newNote) => {
          onNoteCreated(newNote.id);
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

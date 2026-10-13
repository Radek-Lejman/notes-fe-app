import { useGetNote, useUpdateNote, useCreateNote } from '@entities/notes';
import {
  NoteEditorForm,
  useNestedNotePlugin,
  NestedNoteCreator,
  useEditorIntegrations,
} from '@features/manage-notes';
import { Text } from '@chakra-ui/react';
import type { NoteEditWidgetProps } from '../model/types';
import { useNavigate } from 'react-router-dom';

export const NoteEditWidget = ({ noteId }: NoteEditWidgetProps) => {
  const { data: note } = useGetNote(noteId);
  const updateNote = useUpdateNote();
  const createNote = useCreateNote();
  const navigate = useNavigate();

  const handleSave = (data: { title: string; content: string }) => {
    updateNote.mutate({ id: noteId, title: data.title, content: data.content });
  };

  const handlePageCreateRequest = async (title: string) => {
    const newNote = await createNote.mutateAsync({
      title,
      content: '',
      parentId: noteId,
    });
    return { id: newNote.id, title: newNote.title };
  };

  const handlePageNavigateRequest = (id: string) => {
    void navigate(`/note/${id}`);
  };

  const nestedNotePlugin = useNestedNotePlugin({
    onNestedNoteNavigateRequest: handlePageNavigateRequest,
  });
  const integrations = useEditorIntegrations({ currentNoteId: noteId });

  if (!note) {
    return <Text>Note not found</Text>;
  }

  return (
    <NoteEditorForm
      initialTitle={note.title}
      initialContent={note.content ?? ''}
      onSave={handleSave}
      isSaving={updateNote.isPending}
      saveError={
        updateNote.error
          ? updateNote.error.message || 'An error occurred while saving the note'
          : null
      }
      editorExtensions={[...nestedNotePlugin.extensions, ...integrations.extensions]}
      onOpenNote={handlePageNavigateRequest}
      onAskAi={integrations.askAi}
      slashMenuItems={nestedNotePlugin.slashMenuItems}
      editorOverlays={
        <NestedNoteCreator
          isOpen={nestedNotePlugin.isOverlayOpen}
          onClose={nestedNotePlugin.closeOverlay}
          onNestedNoteCreateRequest={handlePageCreateRequest}
        />
      }
    />
  );
};

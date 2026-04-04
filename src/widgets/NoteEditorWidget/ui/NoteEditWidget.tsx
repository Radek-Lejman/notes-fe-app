import { useGetNote, useUpdateNote, useCreateNote } from "@entities/notes";
import { NoteEditorForm, useNestedNotePlugin, NestedNoteCreator } from "@features/manage-notes";
import { type JSONContent } from "@tiptap/react";
import { Text } from "@chakra-ui/react";
import type { NoteEditWidgetProps } from "../model/types";
import { useNavigate } from "react-router-dom";

export const NoteEditWidget = ({ noteId }: NoteEditWidgetProps) => {
  const { data: note } = useGetNote(noteId);
  const updateNote = useUpdateNote();
  const createNote = useCreateNote();
  const navigate = useNavigate();

  const handleSave = (data: { title: string; content: JSONContent | null }) => {
    updateNote.mutate({ id: noteId, title: data.title, content: data.content || {} });
  };

  const handlePageCreateRequest = async (title: string) => {
    const newNote = await createNote.mutateAsync({
      title,
      content: { type: "doc", content: [] },
      parentId: noteId,
    });
    return { id: newNote.id, title: newNote.title };
  };

  const handlePageNavigateRequest = (id: string) => {
    navigate(`/note/${id}`);
  };

  const nestedNotePlugin = useNestedNotePlugin({
    onNestedNoteNavigateRequest: handlePageNavigateRequest,
  });

  if (!note) {
    return <Text>Note not found</Text>;
  }

  const initialContent = typeof note.content === 'string' 
    ? JSON.parse(note.content) 
    : note.content || {};

  return (
    <NoteEditorForm
      initialTitle={note.title}
      initialContent={initialContent as JSONContent}
      onSave={handleSave}
      isSaving={updateNote.isPending}
      editorExtensions={nestedNotePlugin.extensions}
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

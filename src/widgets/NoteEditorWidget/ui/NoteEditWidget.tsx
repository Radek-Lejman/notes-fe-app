import { useGetNote, useUpdateNote } from "@entities/notes";
import { NoteEditorForm } from "@features/manage-notes";
import { type JSONContent } from "@tiptap/react";
import { Text } from "@chakra-ui/react";
import type { NoteEditWidgetProps } from "../model/types";

export const NoteEditWidget = ({ noteId }: NoteEditWidgetProps) => {
  const { data: note } = useGetNote(noteId);
  const updateNote = useUpdateNote();

  const handleSave = (data: { title: string; content: JSONContent | null }) => {
    updateNote.mutate({ id: noteId, title: data.title, content: data.content });
  };

  if (!note) {
    return <Text>Note not found</Text>;
  }

  const initialContent = typeof note.content === 'string' 
    ? JSON.parse(note.content) 
    : note.content;

  return (
    <NoteEditorForm
      initialTitle={note.title}
      initialContent={initialContent as JSONContent}
      onSave={handleSave}
      isSaving={updateNote.isPending}
    />
  );
};

import { useCreateNote } from "@entities/notes";
import { NoteEditorForm } from "@features/manage-notes";
import { type JSONContent } from "@tiptap/react";
import type { NoteCreateWidgetProps } from "../model/types";

export const NoteCreateWidget = ({ onNoteCreated }: NoteCreateWidgetProps) => {
  const createNote = useCreateNote();

  const handleSave = (data: { title: string; content: JSONContent | null }) => {
    createNote.mutate(
      { title: data.title, content: data.content || {} },
      {
        onSuccess: (newNote) => {
          onNoteCreated(newNote.id);
        },
      }
    );
  };

  return (
    <NoteEditorForm
      initialTitle=""
      initialContent={{} as JSONContent}
      onSave={handleSave}
      isSaving={createNote.isPending}
    />
  );
};

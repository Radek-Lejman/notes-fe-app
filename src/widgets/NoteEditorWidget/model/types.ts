export interface NoteEditWidgetProps {
  noteId: string;
}

export interface NoteCreateWidgetProps {
  onNoteCreated: (id: string) => void;
}

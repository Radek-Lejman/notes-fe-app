import { type Extensions, type JSONContent } from '@tiptap/react';
import type { CustomSlashMenuItem } from '@shared/ui/RichEditor/types';

export type InlinePageCreationState =
  | { status: 'idle' }
  | { status: 'creating' }
  | { status: 'success'; noteId: string }
  | { status: 'error'; error: string };

export interface NoteEditorFormProps {
  initialTitle: string;
  initialContent: JSONContent | null;
  onSave: (data: { title: string; content: JSONContent | null }) => void;
  isSaving: boolean;
  editorExtensions?: Extensions;
  slashMenuItems?: CustomSlashMenuItem[];
  editorOverlays?: React.ReactNode;
}

export interface NestedNotePluginProps {
  onNestedNoteNavigateRequest?: (id: string) => void;
  isNestedNoteCreationEnabled?: boolean;
}

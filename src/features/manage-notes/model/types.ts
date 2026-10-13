import { type Extensions } from '@tiptap/react';
import type { AskAi, CustomSlashMenuItem } from '@shared/ui/RichEditor/types';

export type InlinePageCreationState =
  | { status: 'idle' }
  | { status: 'creating' }
  | { status: 'success'; noteId: string }
  | { status: 'error'; error: string };

export interface NoteEditorFormProps {
  initialTitle: string;
  /** Markdown. */
  initialContent: string;
  onSave: (data: { title: string; content: string }) => void;
  isSaving: boolean;
  saveError?: string | null;
  editorExtensions?: Extensions;
  slashMenuItems?: CustomSlashMenuItem[];
  editorOverlays?: React.ReactNode;
  /** Opens another note from a link in this one. */
  onOpenNote?: (noteId: string) => void;
  /** Enables Ask AI in the editor. */
  onAskAi?: AskAi;
}

export interface NestedNotePluginProps {
  onNestedNoteNavigateRequest?: (id: string) => void;
  isNestedNoteCreationEnabled?: boolean;
}

import { type Editor, type Extensions } from '@tiptap/react';
import type React from 'react';
import type { IconType } from 'react-icons';
import type { AiAssistRequest } from '../../lib/editor/ai';

export interface RichEditorContextValue {
  editor: Editor | null;
  isShortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  /** Present when Ask AI is available. */
  askAi?: AskAi;
}

/** Runs an Ask AI request and resolves with the answer (markdown). */
export type AskAi = (request: AiAssistRequest, signal: AbortSignal) => Promise<string>;

export interface CustomSlashMenuItem {
  label: string;
  value: string;
  description?: string;
  icon?: IconType;
  /** Extra search terms for the slash menu. */
  keywords?: string[];
  /** Group heading in the slash menu ("Notes" by default). */
  group?: string;
  shortcut?: string;
  action?: (editor: Editor) => void;
}

export interface RootProps {
  /** Markdown. */
  value: string;
  onChange: (markdown: string) => void;
  /** Mod+S: save right away instead of waiting for autosave. */
  onSave?: () => void;
  /** Opens another note (a `[Title](/notes/<id>)` link); without it links open in a new tab. */
  onOpenNote?: (noteId: string) => void;
  /** Enables Ask AI (selection menu, `/ai`, Mod+J). */
  onAskAi?: AskAi;
  autoFocus?: boolean;
  /** Shown in an empty paragraph under the caret. */
  placeholder?: string;
  className?: string;
  children: React.ReactNode;
  customSlashItems?: CustomSlashMenuItem[];
  extensions?: Extensions;
}

export interface RichEditorTitleProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  placeholder?: string;
}

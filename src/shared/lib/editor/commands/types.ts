import type { Editor } from '@tiptap/core';
import type { IconType } from 'react-icons';

export type BlockGroup = 'basic' | 'lists' | 'advanced';

export interface EditorCommand {
  id: string;
  label: string;
  description?: string;
  icon: IconType;
  /** ProseMirror key notation, e.g. `Mod-Alt-1`. Shown in menus and in the shortcuts dialog. */
  shortcut?: string;
  /** What can be typed instead, e.g. `# `. */
  markdown?: string;
  run: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
}

export interface BlockCommand extends EditorCommand {
  group: BlockGroup;
  /** Extra search terms for the slash menu. */
  keywords?: string[];
  /** Offered in "Turn into" (an existing block can be converted to it). */
  convertible: boolean;
}

export interface ShortcutEntry {
  label: string;
  shortcut?: string;
  markdown?: string;
}

export interface ShortcutSection {
  title: string;
  entries: ShortcutEntry[];
}

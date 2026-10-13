import { type Editor, type Range } from '@tiptap/core';
import type { IconType } from 'react-icons';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: IconType;
  /** Group heading shown when the menu is not filtered. */
  group: string;
  shortcut?: string;
  keywords?: string[];
  command: (props: { editor: Editor; range: Range }) => void;
}

export interface CommandSuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export type CommandSuggestionListProps = {
  items: CommandItem[];
  query: string;
  command: (item: CommandItem) => void;
};

import { type Editor, type Range } from "@tiptap/core";

export interface CommandItem {
  value: string;
  label: string;
  command: (props: { editor: Editor; range: Range }) => void;
}

export interface CommandSuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export interface CommandSuggestionListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

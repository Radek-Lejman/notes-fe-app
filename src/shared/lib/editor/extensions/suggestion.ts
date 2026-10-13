import type { Editor, Range } from '@tiptap/core';
import { CommandSuggestionList } from '../../../ui/RichEditor/SlashCommand/CommandSuggestionList';
import {
  type CommandItem,
  type CommandSuggestionListProps,
} from '../../../ui/RichEditor/SlashCommand/types';
import type { CustomSlashMenuItem } from '../../../ui/RichEditor/types';
import { BLOCK_GROUP_LABELS, blockCommands, rankByQuery } from '../commands';
import { createFloatingRenderer } from './floatingSuggestion';
import { SLASH_COMMAND_PLUGIN_KEY } from './SlashCommand';

const CUSTOM_GROUP = 'Notes';

const toItems = (customItems: CustomSlashMenuItem[]): CommandItem[] => [
  ...blockCommands.map((block) => ({
    id: block.id,
    label: block.label,
    description: block.description,
    icon: block.icon,
    group: BLOCK_GROUP_LABELS[block.group],
    shortcut: block.shortcut,
    keywords: block.keywords,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).run();
      block.run(editor);
    },
  })),
  ...customItems.map((item) => ({
    id: item.value,
    label: item.label,
    description: item.description,
    icon: item.icon,
    group: item.group ?? CUSTOM_GROUP,
    shortcut: item.shortcut,
    keywords: item.keywords,
    command: ({ editor, range }: { editor: Editor; range: Range }) => {
      editor.chain().focus().deleteRange(range).run();
      item.action?.(editor);
    },
  })),
];

export const createSuggestionOptions = (customItems: CustomSlashMenuItem[] = []) => {
  const allItems = toItems(customItems);

  return {
    items: ({ query }: { query: string }) => rankByQuery(allItems, query),
    render: createFloatingRenderer<CommandItem, CommandSuggestionListProps>(
      CommandSuggestionList,
      SLASH_COMMAND_PLUGIN_KEY,
    ),
  };
};

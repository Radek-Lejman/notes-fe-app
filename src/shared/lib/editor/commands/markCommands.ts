import {
  LuBold,
  LuCode,
  LuItalic,
  LuLink,
  LuRemoveFormatting,
  LuStrikethrough,
} from 'react-icons/lu';
import type { EditorCommand } from './types';

export const markCommands = {
  bold: {
    id: 'bold',
    label: 'Bold',
    icon: LuBold,
    shortcut: 'Mod-B',
    markdown: '**text**',
    run: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive('bold'),
  },
  italic: {
    id: 'italic',
    label: 'Italic',
    icon: LuItalic,
    shortcut: 'Mod-I',
    markdown: '*text*',
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive('italic'),
  },
  code: {
    id: 'code',
    label: 'Inline code',
    icon: LuCode,
    shortcut: 'Mod-E',
    markdown: '`code`',
    run: (editor) => editor.chain().focus().toggleCode().run(),
    isActive: (editor) => editor.isActive('code'),
  },
  strike: {
    id: 'strike',
    label: 'Strikethrough',
    icon: LuStrikethrough,
    shortcut: 'Mod-Shift-S',
    markdown: '~~text~~',
    run: (editor) => editor.chain().focus().toggleStrike().run(),
    isActive: (editor) => editor.isActive('strike'),
  },
  link: {
    id: 'link',
    label: 'Link',
    icon: LuLink,
    shortcut: 'Mod-K',
    markdown: '[text](url)',
    run: (editor) => editor.commands.openLinkEditor(),
    isActive: (editor) => editor.isActive('link'),
  },
  clearFormatting: {
    id: 'clearFormatting',
    label: 'Clear formatting',
    icon: LuRemoveFormatting,
    shortcut: 'Mod-\\',
    run: (editor) => editor.chain().focus().unsetAllMarks().run(),
  },
} satisfies Record<string, EditorCommand>;

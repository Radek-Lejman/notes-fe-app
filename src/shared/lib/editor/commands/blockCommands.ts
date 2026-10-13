import type { Editor } from '@tiptap/core';
import {
  LuCode,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuList,
  LuListOrdered,
  LuListTodo,
  LuMinus,
  LuQuote,
  LuType,
} from 'react-icons/lu';
import type { BlockCommand, BlockGroup } from './types';

const WRAPPERS = ['bulletList', 'orderedList', 'taskList', 'blockquote'];

// `clearNodes` lifts the block out of lists and quotes first, so "Turn into" replaces the block
// type instead of nesting it.
const toHeading = (level: 1 | 2 | 3) => (editor: Editor) =>
  editor.chain().focus().clearNodes().setHeading({ level }).run();

export const BLOCK_GROUP_LABELS: Record<BlockGroup, string> = {
  basic: 'Basic blocks',
  lists: 'Lists',
  advanced: 'Advanced',
};

export const blockCommands: BlockCommand[] = [
  {
    id: 'paragraph',
    label: 'Text',
    description: 'Plain paragraph',
    icon: LuType,
    group: 'basic',
    shortcut: 'Mod-Alt-0',
    keywords: ['paragraph', 'plain', 'p'],
    convertible: true,
    run: (editor) => editor.chain().focus().clearNodes().run(),
    isActive: (editor) =>
      editor.isActive('paragraph') && !WRAPPERS.some((type) => editor.isActive(type)),
  },
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Big section title',
    icon: LuHeading1,
    group: 'basic',
    shortcut: 'Mod-Alt-1',
    markdown: '# ',
    keywords: ['h1', '#', 'title'],
    convertible: true,
    run: toHeading(1),
    isActive: (editor) => editor.isActive('heading', { level: 1 }),
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section title',
    icon: LuHeading2,
    group: 'basic',
    shortcut: 'Mod-Alt-2',
    markdown: '## ',
    keywords: ['h2', '##', 'subtitle'],
    convertible: true,
    run: toHeading(2),
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
  },
  {
    id: 'heading3',
    label: 'Heading 3',
    description: 'Small section title',
    icon: LuHeading3,
    group: 'basic',
    shortcut: 'Mod-Alt-3',
    markdown: '### ',
    keywords: ['h3', '###'],
    convertible: true,
    run: toHeading(3),
    isActive: (editor) => editor.isActive('heading', { level: 3 }),
  },
  {
    id: 'bulletList',
    label: 'Bulleted list',
    description: 'Simple list',
    icon: LuList,
    group: 'lists',
    shortcut: 'Mod-Shift-8',
    markdown: '- ',
    keywords: ['ul', 'unordered', 'bullet', '-'],
    convertible: true,
    run: (editor) => {
      if (!editor.isActive('bulletList')) editor.chain().focus().toggleBulletList().run();
    },
    isActive: (editor) => editor.isActive('bulletList'),
  },
  {
    id: 'orderedList',
    label: 'Numbered list',
    description: 'List with numbers',
    icon: LuListOrdered,
    group: 'lists',
    shortcut: 'Mod-Shift-7',
    markdown: '1. ',
    keywords: ['ol', 'ordered', 'number', '1.'],
    convertible: true,
    run: (editor) => {
      if (!editor.isActive('orderedList')) editor.chain().focus().toggleOrderedList().run();
    },
    isActive: (editor) => editor.isActive('orderedList'),
  },
  {
    id: 'taskList',
    label: 'To-do list',
    description: 'Track tasks with checkboxes',
    icon: LuListTodo,
    group: 'lists',
    shortcut: 'Mod-Shift-9',
    markdown: '[] ',
    keywords: ['todo', 'task', 'checkbox', 'check', '[]'],
    convertible: true,
    run: (editor) => {
      if (!editor.isActive('taskList')) editor.chain().focus().toggleTaskList().run();
    },
    isActive: (editor) => editor.isActive('taskList'),
  },
  {
    id: 'blockquote',
    label: 'Quote',
    description: 'Capture a quote',
    icon: LuQuote,
    group: 'advanced',
    shortcut: 'Mod-Shift-B',
    markdown: '> ',
    keywords: ['blockquote', 'citation', '>'],
    convertible: true,
    run: (editor) => {
      if (!editor.isActive('blockquote')) editor.chain().focus().toggleBlockquote().run();
    },
    isActive: (editor) => editor.isActive('blockquote'),
  },
  {
    id: 'codeBlock',
    label: 'Code block',
    description: 'Code with monospace font',
    icon: LuCode,
    group: 'advanced',
    shortcut: 'Mod-Alt-C',
    markdown: '```',
    keywords: ['code', 'snippet', 'pre', '```'],
    convertible: true,
    run: (editor) => {
      if (!editor.isActive('codeBlock')) editor.chain().focus().toggleCodeBlock().run();
    },
    isActive: (editor) => editor.isActive('codeBlock'),
  },
  {
    id: 'horizontalRule',
    label: 'Divider',
    description: 'Separate sections',
    icon: LuMinus,
    group: 'advanced',
    markdown: '---',
    keywords: ['hr', 'horizontal rule', 'separator', 'line', '---'],
    convertible: false,
    run: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

/** The block the selection is in, as one of the convertible commands ("Text" if none match). */
export const getActiveBlockCommand = (editor: Editor): BlockCommand => {
  const convertible = blockCommands.filter((command) => command.convertible);
  // Lists and quotes contain paragraphs, so check them before the plain "Text" entry.
  const [text, ...rest] = convertible;
  return rest.find((command) => command.isActive?.(editor)) ?? text;
};

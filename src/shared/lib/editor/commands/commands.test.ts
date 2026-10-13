import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { createMarkdownExtensions, getEditorMarkdown, SafeMarkdown } from '../markdown';
import { blockCommands, formatShortcut, getActiveBlockCommand, rankByQuery } from './index';

describe('formatShortcut', () => {
  it.each([
    ['Mod-Alt-1', '⌘⌥1', 'Ctrl+Alt+1'],
    ['Mod-Shift-8', '⌘⇧8', 'Ctrl+Shift+8'],
    ['Mod-k', '⌘K', 'Ctrl+K'],
    ['Mod-\\', '⌘\\', 'Ctrl+\\'],
    ['Mod-/', '⌘/', 'Ctrl+/'],
    ['Shift-Enter', '⇧↵', 'Shift+Enter'],
    ['Mod--', '⌘-', 'Ctrl+-'],
  ])('formats %s for macOS and other platforms', (shortcut, mac, other) => {
    expect(formatShortcut(shortcut, true)).toBe(mac);
    expect(formatShortcut(shortcut, false)).toBe(other);
  });
});

describe('rankByQuery', () => {
  const items = [
    { label: 'Text', keywords: ['paragraph'] },
    { label: 'Heading 1', keywords: ['h1', '#'] },
    { label: 'To-do list', keywords: ['todo', 'task'] },
    { label: 'Bulleted list', keywords: ['ul'] },
    { label: 'Code block', keywords: ['code'] },
  ];
  const labels = (query: string) => rankByQuery(items, query).map((item) => item.label);

  it('returns everything in the original order for an empty query', () => {
    expect(labels('  ')).toEqual(items.map((item) => item.label));
  });

  it('matches aliases', () => {
    expect(labels('h1')).toEqual(['Heading 1']);
    expect(labels('todo')).toEqual(['To-do list']);
    expect(labels('#')).toEqual(['Heading 1']);
  });

  it('puts prefix matches before word and substring matches', () => {
    // "list" starts a word in two labels; ties keep the menu order.
    expect(labels('list')).toEqual(['To-do list', 'Bulleted list']);
    expect(labels('co')).toEqual(['Code block']);
    expect(labels('LOCK')).toEqual(['Code block']);
  });

  it('returns nothing when no item matches', () => {
    expect(labels('table')).toEqual([]);
  });
});

describe('block commands', () => {
  const editor = new Editor({ extensions: [SafeMarkdown, ...createMarkdownExtensions()] });
  afterAll(() => editor.destroy());

  const command = (id: string) => {
    const found = blockCommands.find((block) => block.id === id);
    if (!found) throw new Error(`Unknown block command ${id}`);
    return found;
  };

  const load = (markdown: string) => {
    editor.commands.setContent(markdown, { contentType: 'markdown' });
    editor.commands.setTextSelection(2);
  };

  beforeEach(() => load('Plan'));

  it.each([
    ['heading2', '## Plan'],
    ['bulletList', '- Plan'],
    ['orderedList', '1. Plan'],
    ['taskList', '- [ ] Plan'],
    ['blockquote', '> Plan'],
    ['codeBlock', '```\nPlan\n```'],
  ])('turns a paragraph into %s', (id, markdown) => {
    command(id).run(editor);
    expect(getEditorMarkdown(editor)).toBe(markdown);
    expect(getActiveBlockCommand(editor).id).toBe(id);
  });

  it('turns a list item into a heading instead of nesting the heading in the list', () => {
    load('- Plan');
    command('heading1').run(editor);
    expect(getEditorMarkdown(editor)).toBe('# Plan');
  });

  it('turns a task back into plain text', () => {
    load('- [x] Plan');
    expect(getActiveBlockCommand(editor).id).toBe('taskList');
    command('paragraph').run(editor);
    expect(getEditorMarkdown(editor)).toBe('Plan');
    expect(getActiveBlockCommand(editor).id).toBe('paragraph');
  });

  it('switches between list types', () => {
    load('- Plan');
    command('orderedList').run(editor);
    expect(getEditorMarkdown(editor)).toBe('1. Plan');
  });

  it('keeps the block when it already has the chosen type', () => {
    load('- Plan');
    command('bulletList').run(editor);
    expect(getEditorMarkdown(editor)).toBe('- Plan');
  });
});

import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { createMarkdownExtensions, getEditorMarkdown, SafeMarkdown } from '../markdown';
import { applyAiAnswer, getAiText } from '../ai';
import { BlockActions } from './BlockActions';
import { EditorUi } from './EditorUi';
import { NoteLinkSuggestion, linkContent } from './NoteLinkSuggestion';

const NOTE_ID = '3f2a9c1e-8b7d-4e6a-9f10-2c4d5e6f7a8b';

const editor = new Editor({
  extensions: [
    SafeMarkdown,
    ...createMarkdownExtensions(),
    BlockActions,
    EditorUi.configure({ aiEnabled: true }),
    NoteLinkSuggestion,
  ],
});
afterAll(() => editor.destroy());

const load = (markdown: string) => {
  editor.commands.setContent(markdown, { contentType: 'markdown' });
  editor.storage.editorUi.aiRange = null;
};
const md = () => getEditorMarkdown(editor);
/** Puts the caret inside the first text block containing `text`. */
const caretIn = (text: string) => {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    if (found < 0 && node.isTextblock && node.textContent.includes(text)) found = pos + 1;
  });
  if (found < 0) throw new Error(`No block with "${text}"`);
  editor.commands.setTextSelection(found + node(found).indexOf(text));
};
const node = (pos: number) => editor.state.doc.resolve(pos).parent.textContent;

describe('block actions', () => {
  beforeEach(() => load('# A\n\nB\n\nC'));

  it('moves the block with the caret up and down', () => {
    caretIn('C');
    expect(editor.commands.moveBlockUp()).toBe(true);
    expect(md()).toBe('# A\n\nC\n\nB');

    expect(editor.commands.moveBlockUp()).toBe(true);
    expect(md()).toBe('C\n\n# A\n\nB');
    expect(editor.state.selection.$from.parent.textContent).toBe('C');

    expect(editor.commands.moveBlockUp()).toBe(false);
    expect(editor.commands.moveBlockDown()).toBe(true);
    expect(md()).toBe('# A\n\nC\n\nB');
  });

  it('does not move the last block further down', () => {
    caretIn('C');
    expect(editor.commands.moveBlockDown()).toBe(false);
    expect(md()).toBe('# A\n\nB\n\nC');
  });

  it('moves list items inside their list', () => {
    load('- one\n- two\n- three');
    caretIn('three');
    editor.commands.moveBlockUp();
    expect(md()).toBe('- one\n- three\n- two');
  });

  it('duplicates and deletes a block', () => {
    caretIn('B');
    editor.commands.duplicateBlock();
    expect(md()).toBe('# A\n\nB\n\nB\n\nC');
    // The caret moves to the copy; after deleting it, the caret is in the next block.
    editor.commands.deleteBlock();
    expect(md()).toBe('# A\n\nB\n\nC');
    expect(editor.state.selection.$from.parent.textContent).toBe('C');
  });

  it('adds a new paragraph or list item below', () => {
    caretIn('A');
    editor.commands.insertBlockBelow();
    editor.commands.insertContent('new');
    expect(md()).toBe('# A\n\nnew\n\nB\n\nC');

    load('- [ ] task');
    caretIn('task');
    editor.commands.insertBlockBelow();
    editor.commands.insertContent('next');
    expect(md()).toBe('- [ ] task\n- [ ] next');
  });
});

describe('Ask AI answers', () => {
  const selectText = (text: string) => {
    caretIn(text);
    const from = editor.state.selection.from;
    editor.commands.setTextSelection({ from, to: from + text.length });
    editor.commands.openAiPanel();
    const range = editor.storage.editorUi.aiRange;
    if (!range) throw new Error('AI panel did not open');
    return range;
  };

  it('sends the selection as markdown', () => {
    load('Some **bold** words here');
    expect(getAiText(editor, selectText('Some bold words'))).toBe('Some **bold** words');
  });

  it('sends the text before the cursor when nothing is selected', () => {
    load('# Plan\n\nFirst step');
    caretIn('First step');
    editor.commands.setTextSelection(editor.state.selection.from + 'First step'.length);
    editor.commands.openAiPanel();
    const range = editor.storage.editorUi.aiRange;
    expect(range && getAiText(editor, range)).toBe('Plan\n\nFirst step');
  });

  it('replaces the selection with an inline answer', () => {
    load('Fix tihs sentence please');
    const range = selectText('tihs sentence');
    applyAiAnswer(editor, 'this *sentence*', range, 'replace');
    expect(md()).toBe('Fix this *sentence* please');
    expect(editor.storage.editorUi.aiRange).toBeNull();
  });

  it('inserts a block answer below the selected block', () => {
    load('Long text\n\nNext');
    const range = selectText('Long text');
    applyAiAnswer(editor, '- point one\n- point two', range, 'below');
    expect(md()).toBe('Long text\n\n- point one\n- point two\n\nNext');
  });

  it('keeps the range in place while the note changes', () => {
    load('Alpha beta');
    const range = selectText('beta');
    editor.commands.insertContentAt(1, 'New ');
    expect(editor.storage.editorUi.aiRange).toEqual({ from: range.from + 4, to: range.to + 4 });
  });
});

describe('note links', () => {
  it('inserts a link to the note that is saved as markdown', () => {
    load('See ');
    editor.commands.setTextSelection(5);
    editor.commands.insertContent(linkContent({ id: NOTE_ID, title: 'Plan [v2]' }));
    expect(md()).toBe(`See [Plan \\[v2\\]](/notes/${NOTE_ID}) `);
  });
});

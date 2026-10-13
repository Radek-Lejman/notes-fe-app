import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import { AllSelection, NodeSelection, TextSelection } from '@tiptap/pm/state';
import { createMarkdownExtensions, getEditorMarkdown, SafeMarkdown } from '../markdown';
import { applyLink, normalizeUrl, removeLink } from '../link';
import { EditorUi, getSelectionMenuMode } from './EditorUi';

const onSave = vi.fn();
const onShowShortcuts = vi.fn();
const element = document.createElement('div');
document.body.appendChild(element);

const editor = new Editor({
  element,
  extensions: [
    SafeMarkdown,
    ...createMarkdownExtensions(),
    EditorUi.configure({ onSave, onShowShortcuts }),
  ],
});
afterAll(() => editor.destroy());

const ui = () => editor.storage.editorUi;

const load = (markdown: string) => {
  editor.commands.setContent(markdown, { contentType: 'markdown' });
  Object.assign(ui(), {
    pointerDown: false,
    keyboardSelection: false,
    dismissed: false,
    linkEditing: false,
  });
};

const select = (from: number, to: number) =>
  editor.view.dispatch(
    editor.state.tr.setSelection(TextSelection.create(editor.state.doc, from, to)),
  );

// jsdom is not macOS, so ProseMirror's `Mod` is Ctrl here.
const press = (key: string, modifiers: KeyboardEventInit = {}) =>
  editor.view.someProp('handleKeyDown', (handler) =>
    handler(editor.view, new KeyboardEvent('keydown', { key, ...modifiers })),
  );

describe('selection menu mode', () => {
  beforeEach(() => load('Some **text** here'));

  it('shows formatting for a finished mouse selection', () => {
    select(1, 5);
    expect(getSelectionMenuMode(editor)).toBe('format');
  });

  it('waits until the mouse button is released', () => {
    // Straight to the plugin: jsdom cannot run ProseMirror's own mousedown (no layout).
    editor.view.someProp('handleDOMEvents', (handlers) =>
      handlers.mousedown?.(editor.view, new MouseEvent('mousedown', { button: 0 })),
    );
    select(1, 5);
    expect(getSelectionMenuMode(editor)).toBeNull();

    window.dispatchEvent(new MouseEvent('mouseup'));
    expect(getSelectionMenuMode(editor)).toBe('format');
  });

  it('stays hidden for a keyboard selection', () => {
    press('ArrowRight', { shiftKey: true });
    select(1, 5);
    expect(getSelectionMenuMode(editor)).toBeNull();
  });

  it('stays hidden for select-all and node selections', () => {
    editor.view.dispatch(editor.state.tr.setSelection(new AllSelection(editor.state.doc)));
    expect(getSelectionMenuMode(editor)).toBeNull();

    load('a\n\n---\n\nb');
    editor.view.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 3)));
    expect(getSelectionMenuMode(editor)).toBeNull();
  });

  it('stays hidden inside code blocks and for an empty caret', () => {
    load('```\nconst a = 1;\n```');
    select(1, 6);
    expect(getSelectionMenuMode(editor)).toBeNull();

    load('plain');
    select(2, 2);
    expect(getSelectionMenuMode(editor)).toBeNull();
  });

  it('closes on Escape until the selection changes', () => {
    select(1, 5);
    expect(press('Escape')).toBe(true);
    expect(getSelectionMenuMode(editor)).toBeNull();

    select(1, 4);
    expect(getSelectionMenuMode(editor)).toBe('format');
  });

  it('lets Escape through when no menu is open', () => {
    select(2, 2);
    expect(press('Escape')).toBeFalsy();
  });
});

describe('links', () => {
  beforeEach(() => load('Read the docs today'));

  it('opens the link editor with Mod+K', () => {
    select(10, 14);
    press('k', { ctrlKey: true });
    expect(getSelectionMenuMode(editor)).toBe('linkEdit');
  });

  it('links the selection and puts the caret after it', () => {
    select(10, 14);
    editor.commands.openLinkEditor();
    applyLink(editor, 'docs.example.com');

    expect(getEditorMarkdown(editor)).toBe('Read the [docs](https://docs.example.com) today');
    expect(editor.state.selection.empty).toBe(true);
    expect(ui().linkEditing).toBe(false);
  });

  it('shows the link card when the caret is in a link', () => {
    load('Read the [docs](https://example.com) today');
    select(12, 12);
    expect(getSelectionMenuMode(editor)).toBe('linkView');
  });

  it('edits and removes the whole link under the caret', () => {
    load('Read the [docs](https://example.com) today');
    select(12, 12);
    press('k', { ctrlKey: true });
    applyLink(editor, 'https://other.example');
    expect(getEditorMarkdown(editor)).toBe('Read the [docs](https://other.example) today');

    select(12, 12);
    removeLink(editor);
    expect(getEditorMarkdown(editor)).toBe('Read the docs today');
  });

  it('inserts the URL as linked text when nothing is selected', () => {
    select(1, 1);
    editor.commands.openLinkEditor();
    applyLink(editor, 'example.com');
    expect(getEditorMarkdown(editor)).toBe('[example.com](https://example.com)Read the docs today');
  });
});

describe('shortcuts', () => {
  beforeEach(() => load('Some **text** here'));

  it('saves on Mod+S and opens the shortcuts dialog on Mod+/', () => {
    expect(press('s', { ctrlKey: true })).toBe(true);
    expect(onSave).toHaveBeenCalledTimes(1);

    expect(press('/', { ctrlKey: true })).toBe(true);
    expect(onShowShortcuts).toHaveBeenCalledTimes(1);
  });

  it('clears formatting with Mod+\\', () => {
    editor.commands.selectAll();
    press('\\', { ctrlKey: true });
    expect(getEditorMarkdown(editor)).toBe('Some text here');
  });
});

describe('normalizeUrl', () => {
  it.each([
    ['  example.com/a ', 'https://example.com/a'],
    ['http://example.com', 'http://example.com'],
    ['mailto:a@b.pl', 'mailto:a@b.pl'],
    ['jan@firma.pl', 'mailto:jan@firma.pl'],
    ['/notes/123', '/notes/123'],
    ['#section', '#section'],
  ])('%j -> %j', (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });

  it('returns null for an empty value', () => {
    expect(normalizeUrl('   ')).toBeNull();
  });
});

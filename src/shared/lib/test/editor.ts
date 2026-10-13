import type { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

/** The Tiptap editor behind a rendered editor element (Tiptap keeps it on the DOM node). */
export const editorOf = (element: HTMLElement) =>
  (element as HTMLElement & { editor: Editor }).editor;

/** Runs the editor's key handling (plugins, suggestions) like a real key press. */
export const press = (editor: Editor, key: string, init: KeyboardEventInit = {}) =>
  editor.view.someProp('handleKeyDown', (handler) =>
    handler(editor.view, new KeyboardEvent('keydown', { key, ...init })),
  );

export const select = (editor: Editor, from: number, to = from) =>
  editor.view.dispatch(
    editor.state.tr.setSelection(TextSelection.create(editor.state.doc, from, to)),
  );

/** Types text at the caret, one character at a time (input rules and suggestions see it). */
export const typeText = (editor: Editor, text: string) => {
  for (const char of text) {
    const { from, to } = editor.state.selection;
    const insert = () => editor.state.tr.insertText(char, from, to);
    const handled = editor.view.someProp('handleTextInput', (handler) =>
      handler(editor.view, from, to, char, insert),
    );
    if (!handled) editor.view.dispatch(insert().scrollIntoView());
  }
};

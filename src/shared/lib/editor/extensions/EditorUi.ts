import { Extension, type Editor } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { noteIdFromHref } from '../link';

export const EDITOR_UI_META = 'editorUi';
const pluginKey = new PluginKey(EDITOR_UI_META);

const SELECTION_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
]);

const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;

export interface EditorUiOptions {
  onSave?: () => void;
  onShowShortcuts?: () => void;
  /** Opens another note in the app (links to `/notes/<id>`); without it they open in a new tab. */
  onOpenNote?: (noteId: string) => void;
  /** Ask AI is available (Mod+J opens it). */
  aiEnabled: boolean;
}

export interface EditorUiStorage {
  /** A mouse button is held in the editor (the user is still dragging a selection). */
  pointerDown: boolean;
  /** The current selection was made with Shift + arrows: whoever does that knows the shortcuts. */
  keyboardSelection: boolean;
  /** Escape closed the menu; it stays closed until the selection changes. */
  dismissed: boolean;
  linkEditing: boolean;
  /** The Ask AI panel is open for this range (mapped through edits; empty = at the cursor). */
  aiRange: { from: number; to: number } | null;
  /** Touch devices format from the toolbar above the keyboard, not from a selection menu. */
  touch: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    editorUi: {
      openLinkEditor: () => ReturnType;
      closeLinkEditor: () => ReturnType;
      openAiPanel: () => ReturnType;
      closeAiPanel: () => ReturnType;
      /** Opens a link: another note inside the app, anything else in a new tab. */
      openLink: (href: string) => ReturnType;
    };
  }
  interface Storage {
    editorUi: EditorUiStorage;
  }
}

export type SelectionMenuMode = 'format' | 'linkEdit' | 'linkView' | 'ai' | null;

/**
 * What the selection menu should show. Formatting appears only for a finished mouse selection of
 * text: not while dragging, not for keyboard selections, select-all, node selections or code
 * blocks, not on touch devices (they have the toolbar above the keyboard), and not after Escape.
 */
export const getSelectionMenuMode = (editor: Editor): SelectionMenuMode => {
  const ui = editor.storage.editorUi;
  if (!editor.isEditable) return null;
  if (ui.aiRange) return 'ai';
  if (ui.linkEditing) return 'linkEdit';
  if (ui.dismissed || ui.pointerDown) return null;

  const { selection, doc } = editor.state;
  if (selection.empty) return editor.isActive('link') ? 'linkView' : null;
  if (!(selection instanceof TextSelection) || ui.keyboardSelection || ui.touch) return null;
  if (editor.isActive('codeBlock')) return null;
  if (!doc.textBetween(selection.from, selection.to).trim()) return null;
  return 'format';
};

/** Re-renders the menus after a UI-only state change (no document or selection change). */
const notify = (editor: Editor) => {
  if (editor.isDestroyed) return;
  editor.view.dispatch(editor.state.tr.setMeta(EDITOR_UI_META, true));
};

export const EditorUi = Extension.create<EditorUiOptions, EditorUiStorage>({
  name: 'editorUi',

  addOptions() {
    return {
      onSave: undefined,
      onShowShortcuts: undefined,
      onOpenNote: undefined,
      aiEnabled: false,
    };
  },

  addStorage() {
    return {
      pointerDown: false,
      keyboardSelection: false,
      dismissed: false,
      linkEditing: false,
      aiRange: null,
      touch: isTouchDevice(),
    };
  },

  onTransaction({ transaction }) {
    const range = this.storage.aiRange;
    if (range && transaction.docChanged) {
      this.storage.aiRange = {
        from: transaction.mapping.map(range.from, -1),
        to: transaction.mapping.map(range.to, 1),
      };
    }
  },

  addCommands() {
    return {
      openLinkEditor:
        () =>
        ({ editor, tr, dispatch }) => {
          if (!editor.isEditable) return false;
          if (dispatch) {
            this.storage.linkEditing = true;
            this.storage.dismissed = false;
            tr.setMeta(EDITOR_UI_META, true);
          }
          return true;
        },
      closeLinkEditor:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            this.storage.linkEditing = false;
            tr.setMeta(EDITOR_UI_META, true);
          }
          return true;
        },
      openAiPanel:
        () =>
        ({ editor, tr, dispatch }) => {
          if (!editor.isEditable || !this.options.aiEnabled) return false;
          if (dispatch) {
            const { from, to } = tr.selection;
            this.storage.aiRange = { from, to };
            this.storage.linkEditing = false;
            this.storage.dismissed = false;
            tr.setMeta(EDITOR_UI_META, true);
          }
          return true;
        },
      closeAiPanel:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            this.storage.aiRange = null;
            tr.setMeta(EDITOR_UI_META, true);
          }
          return true;
        },
      openLink:
        (href) =>
        ({ dispatch }) => {
          if (!dispatch) return true;
          const noteId = noteIdFromHref(href);
          if (noteId && this.options.onOpenNote) this.options.onOpenNote(noteId);
          else window.open(href, '_blank', 'noopener,noreferrer');
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-k': ({ editor }) => {
        // Edit the whole link when the caret is inside one.
        if (editor.state.selection.empty && editor.isActive('link')) {
          editor.commands.extendMarkRange('link');
        }
        return editor.commands.openLinkEditor();
      },
      'Mod-j': ({ editor }) => editor.commands.openAiPanel(),
      'Mod-\\': ({ editor }) => editor.commands.unsetAllMarks(),
      'Mod-s': () => {
        this.options.onSave?.();
        return true; // never the browser's "Save page" dialog
      },
      'Mod-/': () => {
        this.options.onShowShortcuts?.();
        return true;
      },
      Escape: ({ editor }) => {
        if (!getSelectionMenuMode(editor)) return false;
        this.storage.dismissed = true;
        this.storage.linkEditing = false;
        this.storage.aiRange = null;
        notify(editor);
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const { editor, storage } = this;

    return [
      new Plugin({
        key: pluginKey,
        view: () => {
          const onPointerUp = () => {
            if (!storage.pointerDown) return;
            storage.pointerDown = false;
            notify(editor);
          };
          window.addEventListener('mouseup', onPointerUp);
          return {
            update: (view, prevState) => {
              if (!prevState.selection.eq(view.state.selection)) storage.dismissed = false;
            },
            destroy: () => window.removeEventListener('mouseup', onPointerUp),
          };
        },
        props: {
          handleDOMEvents: {
            mousedown: (_view, event) => {
              if (event.button !== 0) return false;
              storage.pointerDown = true;
              storage.keyboardSelection = false;
              storage.dismissed = false;
              storage.linkEditing = false;
              storage.aiRange = null;
              return false;
            },
          },
          handleKeyDown: (_view, event) => {
            if (event.shiftKey && SELECTION_KEYS.has(event.key)) storage.keyboardSelection = true;
            return false;
          },
          handleClick: (_view, _pos, event) => {
            if (!(event.metaKey || event.ctrlKey)) return false;
            const anchor = (event.target as HTMLElement | null)?.closest('a[href]');
            const href = anchor?.getAttribute('href');
            if (!href) return false;
            return editor.commands.openLink(href);
          },
        },
      }),
    ];
  },
});

import { Extension, type Editor, type Range } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion from '@tiptap/suggestion';
import { NoteLinkList } from '../../../ui/RichEditor/NoteLink/NoteLinkList';
import type {
  NoteLinkItem,
  NoteLinkListProps,
  NoteLinkTarget,
} from '../../../ui/RichEditor/NoteLink/types';
import { noteHref } from '../link';
import { createFloatingRenderer } from './floatingSuggestion';

export const NOTE_LINK_PLUGIN_KEY = new PluginKey('noteLink');
const MAX_RESULTS = 8;

export interface NoteLinkOptions {
  /** Notes matching the query, best first. */
  findNotes: (query: string) => Promise<NoteLinkTarget[]> | NoteLinkTarget[];
  /** Creates a note with this title; without it the picker cannot create notes. */
  createNote?: (title: string) => Promise<NoteLinkTarget>;
}

/** The note as an inline link `[Title](/notes/<id>)`, followed by a space to keep typing. */
export const linkContent = (note: NoteLinkTarget) => [
  {
    type: 'text',
    text: note.title || 'Untitled',
    marks: [{ type: 'link', attrs: { href: noteHref(note.id) } }],
  },
  { type: 'text', text: ' ' },
];

/** `[[` opens a note picker; the chosen (or a new) note is inserted as a link. */
export const NoteLinkSuggestion = Extension.create<NoteLinkOptions>({
  name: 'noteLinkSuggestion',

  addOptions() {
    return { findNotes: () => [], createNote: undefined };
  },

  addProseMirrorPlugins() {
    const { findNotes, createNote } = this.options;

    return [
      Suggestion<NoteLinkItem, NoteLinkItem>({
        editor: this.editor,
        char: '[[',
        pluginKey: NOTE_LINK_PLUGIN_KEY,
        allowSpaces: true, // note titles have spaces
        allow: ({ state, range }) => !state.doc.resolve(range.from).parent.type.spec.code,
        items: async ({ query }) => {
          const title = query.replace(/\]\]$/, '').trim();
          const notes = (await findNotes(title)).slice(0, MAX_RESULTS);
          const items: NoteLinkItem[] = notes.map((note) => ({ kind: 'note', note }));
          const exists = notes.some((note) => note.title.toLowerCase() === title.toLowerCase());
          if (createNote && title && !exists) items.push({ kind: 'create', title });
          return items;
        },
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: NoteLinkItem;
        }) => {
          if (props.kind === 'note') {
            editor.chain().focus().insertContentAt(range, linkContent(props.note)).run();
            return;
          }
          editor.chain().focus().deleteRange(range).run();
          void createNote?.(props.title)
            .then((note) => editor.chain().focus().insertContent(linkContent(note)).run())
            // The note could not be created: keep what the user typed as plain text.
            .catch(() => editor.chain().focus().insertContent(props.title).run());
        },
        render: createFloatingRenderer<NoteLinkItem, NoteLinkListProps>(
          NoteLinkList,
          NOTE_LINK_PLUGIN_KEY,
        ),
      }),
    ];
  },
});

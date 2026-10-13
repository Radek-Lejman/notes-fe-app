import type { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

// Same format as a page reference: `[Title](/notes/<uuid>)`.
const NOTE_HREF = /^\/notes\/([0-9a-f-]{36})$/i;

/** The note id of a link to another note, or null for any other link. */
export const noteIdFromHref = (href: string): string | null => NOTE_HREF.exec(href)?.[1] ?? null;

export const noteHref = (noteId: string) => `/notes/${noteId}`;

/**
 * Turns what the user typed into an href: `example.com` -> `https://example.com`,
 * `a@b.pl` -> `mailto:a@b.pl`. URLs with a scheme, absolute paths and anchors are kept.
 * Returns null for an empty input. Unsafe schemes are rejected later by the Link extension.
 */
export const normalizeUrl = (input: string): string | null => {
  const url = input.trim();
  if (!url) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('/') || url.startsWith('#')) return url;
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(url)) return `mailto:${url}`;
  return `https://${url}`;
};

/**
 * Applies the link editor's value: links the selection (or the whole link under the caret),
 * inserts the URL as linked text when nothing is selected, removes the link for an empty value.
 */
export const applyLink = (editor: Editor, input: string) => {
  const href = normalizeUrl(input);
  const chain = editor.chain().focus().closeLinkEditor();

  if (!href) {
    chain.extendMarkRange('link').unsetLink().run();
    return;
  }

  if (editor.state.selection.empty && !editor.isActive('link')) {
    chain
      .insertContent({
        type: 'text',
        text: input.trim(),
        marks: [{ type: 'link', attrs: { href } }],
      })
      .run();
    return;
  }

  chain
    .extendMarkRange('link')
    .setLink({ href })
    // Caret after the link, so typing continues the sentence and the link card shows up.
    .command(({ tr }) => {
      tr.setSelection(TextSelection.create(tr.doc, tr.selection.to));
      return true;
    })
    .run();
};

export const removeLink = (editor: Editor) =>
  editor.chain().focus().closeLinkEditor().extendMarkRange('link').unsetLink().run();

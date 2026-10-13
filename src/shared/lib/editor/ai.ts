import type { Editor, JSONContent } from '@tiptap/core';
import { serializeMarkdown } from './markdown';

export type AiAssistAction =
  | 'explain'
  | 'summarize'
  | 'improve'
  | 'fix'
  | 'translate'
  | 'continue'
  | 'custom';

export interface AiAssistRequest {
  action: AiAssistAction;
  /** Selected markdown, or the note text before the cursor; absent in an empty note. */
  text?: string;
  instruction?: string;
}

export interface AiRange {
  from: number;
  to: number;
}

/** How much of the note before the cursor goes along as context when writing new text. */
const CONTEXT_CHARS = 4_000;

const markdownOf = (editor: Editor, content: JSONContent[]) => {
  if (!editor.markdown) throw new Error('Markdown extension is not registered on this editor');
  return serializeMarkdown(editor.markdown, { type: 'doc', content });
};

/**
 * The text Ask AI works on: the selection as markdown (so formatting survives a rewrite), or,
 * with nothing selected, the note text before the cursor. Undefined when there is none.
 */
export const getAiText = (editor: Editor, { from, to }: AiRange): string | undefined => {
  const { doc } = editor.state;
  if (from === to) {
    return doc.textBetween(Math.max(0, from - CONTEXT_CHARS), from, '\n\n').trim() || undefined;
  }
  // A selection inside one paragraph slices to bare inline nodes: give them their paragraph back.
  const { content } = doc.slice(from, to);
  const json = content.toJSON() as JSONContent[];
  const text = markdownOf(
    editor,
    content.firstChild?.isInline ? [{ type: 'paragraph', content: json }] : json,
  );
  return text.trim() || undefined;
};

/** The AI answer as editor content; a single paragraph is inserted inline, into the text. */
const parseAnswer = (editor: Editor, markdown: string): JSONContent[] => {
  if (!editor.markdown) throw new Error('Markdown extension is not registered on this editor');
  const blocks = editor.markdown.parse(markdown).content ?? [];
  const [first] = blocks;
  return blocks.length === 1 && first.type === 'paragraph' ? (first.content ?? []) : blocks;
};

/**
 * Puts the AI answer into the note: in place of the range (the selection, or at the cursor), or
 * as new blocks after the block where the range ends. Closes the panel; one undo reverts it.
 */
export const applyAiAnswer = (
  editor: Editor,
  markdown: string,
  range: AiRange,
  placement: 'replace' | 'below',
) => {
  const chain = editor.chain().focus().closeAiPanel();

  if (placement === 'replace') {
    chain.insertContentAt(range, parseAnswer(editor, markdown)).run();
    return;
  }

  const $end = editor.state.doc.resolve(range.to);
  const afterBlock = $end.depth > 0 ? $end.after(1) : range.to;
  chain.insertContentAt(afterBlock, editor.markdown?.parse(markdown).content ?? []).run();
};

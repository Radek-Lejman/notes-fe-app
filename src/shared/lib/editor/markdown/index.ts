import type { Editor } from '@tiptap/core';
import { serializeMarkdown } from './markdownExtensions';

export {
  createMarkdownExtensions,
  pageReferenceMarkdown,
  serializeMarkdown,
  PAGE_REFERENCE_NODE,
} from './markdownExtensions';
export { escapeMarkdownDoc } from './markdownEscape';
export { SafeMarkdown } from './safeMarkdown';

/** Markdown of the editor's current document (requires the Markdown extension). */
export function getEditorMarkdown(editor: Editor): string {
  if (!editor.markdown) throw new Error('Markdown extension is not registered on this editor');
  return serializeMarkdown(editor.markdown, editor.getJSON());
}

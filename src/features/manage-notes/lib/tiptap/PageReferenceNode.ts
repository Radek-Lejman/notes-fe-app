import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { PAGE_REFERENCE_NODE, pageReferenceMarkdown } from '@shared/lib/editor/markdown';
import { PageReferenceNodeView } from './PageReferenceNodeView';

export interface PageReferenceOptions {
  onPageNavigateRequest?: (noteId: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageReference: {
      insertPageReference: (options: { noteId: string; title: string }) => ReturnType;
    };
  }
}

export const PageReferenceNode = Node.create<PageReferenceOptions>({
  name: PAGE_REFERENCE_NODE,
  // Stored as `[Title](/notes/<id>)` on its own line.
  ...pageReferenceMarkdown,
  group: 'block',
  atom: true, // It's a single block, no text content inside it manageable by editor

  addAttributes() {
    return {
      noteId: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-reference"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'page-reference' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageReferenceNodeView);
  },

  addCommands() {
    return {
      insertPageReference:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

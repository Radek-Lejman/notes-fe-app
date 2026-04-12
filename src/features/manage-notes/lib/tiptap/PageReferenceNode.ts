import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
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
  name: 'pageReference',
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

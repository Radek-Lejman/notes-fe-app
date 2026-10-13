import { Extension } from '@tiptap/core';
import type { Node as PmNode } from '@tiptap/pm/model';
import { Selection, TextSelection, type EditorState, type Transaction } from '@tiptap/pm/state';

/** List items move inside their list; everything else moves as a whole top-level block. */
const ITEM_TYPES = new Set(['listItem', 'taskItem']);

export interface BlockRef {
  pos: number;
  node: PmNode;
}

/**
 * The block a position belongs to: the closest list item, otherwise the top-level block.
 * `pos` may also point right before a top-level atom (e.g. a divider or a sub-note link).
 */
export const findBlock = (state: EditorState, pos = state.selection.from): BlockRef | null => {
  const { doc } = state;
  const atom = doc.nodeAt(pos);
  const $pos = doc.resolve(pos);
  if ($pos.depth === 0) return atom ? { pos, node: atom } : null;

  for (let depth = $pos.depth; depth > 0; depth--) {
    if (ITEM_TYPES.has($pos.node(depth).type.name)) {
      return { pos: $pos.before(depth), node: $pos.node(depth) };
    }
  }
  return { pos: $pos.before(1), node: $pos.node(1) };
};

/** Keeps the caret at the same offset inside the block after it was moved to `newPos`. */
const keepSelection = (tr: Transaction, state: EditorState, block: BlockRef, newPos: number) => {
  const offset = Math.min(Math.max(state.selection.from - block.pos, 0), block.node.nodeSize - 1);
  const $target = tr.doc.resolve(Math.min(newPos + offset, tr.doc.content.size));
  tr.setSelection(Selection.near($target));
};

const moveBlock = (state: EditorState, tr: Transaction, block: BlockRef, direction: -1 | 1) => {
  const $block = state.doc.resolve(block.pos);
  const index = $block.index();
  const sibling =
    direction === -1 ? $block.parent.maybeChild(index - 1) : $block.parent.maybeChild(index + 1);
  if (!sibling) return false;

  const end = block.pos + block.node.nodeSize;
  tr.delete(block.pos, end);
  const target = direction === -1 ? block.pos - sibling.nodeSize : block.pos + sibling.nodeSize;
  tr.insert(target, block.node);
  keepSelection(tr, state, block, target);
  return true;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockActions: {
      /** `pos`: any position inside the block; defaults to the selection. */
      moveBlockUp: (pos?: number) => ReturnType;
      moveBlockDown: (pos?: number) => ReturnType;
      duplicateBlock: (pos?: number) => ReturnType;
      deleteBlock: (pos?: number) => ReturnType;
      /** Adds an empty paragraph after the block and puts the caret in it. */
      insertBlockBelow: (pos?: number) => ReturnType;
    };
  }
}

export const BlockActions = Extension.create({
  name: 'blockActions',

  addCommands() {
    return {
      moveBlockUp:
        (pos) =>
        ({ state, tr, dispatch }) => {
          const block = findBlock(state, pos);
          if (!block) return false;
          if (!dispatch) return state.doc.resolve(block.pos).index() > 0;
          return moveBlock(state, tr, block, -1);
        },
      moveBlockDown:
        (pos) =>
        ({ state, tr, dispatch }) => {
          const block = findBlock(state, pos);
          if (!block) return false;
          const $block = state.doc.resolve(block.pos);
          if (!dispatch) return $block.index() < $block.parent.childCount - 1;
          return moveBlock(state, tr, block, 1);
        },
      duplicateBlock:
        (pos) =>
        ({ state, tr, dispatch }) => {
          const block = findBlock(state, pos);
          if (!block) return false;
          if (dispatch) {
            const copyPos = block.pos + block.node.nodeSize;
            tr.insert(copyPos, block.node.copy(block.node.content));
            keepSelection(tr, state, block, copyPos);
          }
          return true;
        },
      deleteBlock:
        (pos) =>
        ({ state, tr, dispatch }) => {
          const block = findBlock(state, pos);
          if (!block) return false;
          if (dispatch) tr.delete(block.pos, block.pos + block.node.nodeSize);
          return true;
        },
      insertBlockBelow:
        (pos) =>
        ({ state, tr, dispatch }) => {
          const block = findBlock(state, pos);
          const paragraph = state.schema.nodes.paragraph;
          if (!block || !paragraph) return false;
          if (dispatch) {
            // A list item gets a new item, anything else a new paragraph.
            const isItem = ITEM_TYPES.has(block.node.type.name);
            const node = isItem
              ? block.node.type.createAndFill(
                  block.node.type.name === 'taskItem' ? { checked: false } : null,
                )
              : paragraph.create();
            if (!node) return false;
            const at = block.pos + block.node.nodeSize;
            tr.insert(at, node);
            tr.setSelection(TextSelection.near(tr.doc.resolve(at + 1)));
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-ArrowUp': ({ editor }) => editor.commands.moveBlockUp(),
      'Mod-Shift-ArrowDown': ({ editor }) => editor.commands.moveBlockDown(),
      'Mod-d': ({ editor }) => editor.commands.duplicateBlock(),
    };
  },
});

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import { Box, Flex, Text } from '@chakra-ui/react';
import {
  LuArrowDown,
  LuArrowUp,
  LuChevronRight,
  LuCopy,
  LuGripVertical,
  LuPlus,
  LuRepeat2,
  LuTrash2,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { blockCommands, formatShortcut } from '../../lib/editor/commands';
import { findBlock } from '../../lib/editor/extensions/BlockActions';
import { panelProps } from './menuStyles';
import { EditorTooltip } from './EditorTooltip';

const HANDLE_HEIGHT = 24;
const HANDLE_WIDTH = 44;

interface HoveredBlock {
  pos: number;
  top: number;
  left: number;
}

/** The block under a point, with the handle position relative to the container. */
const blockAt = (editor: Editor, container: HTMLElement, x: number, y: number) => {
  const { view } = editor;
  const hit = view.posAtCoords({ left: x, top: y });
  if (!hit) return null;
  const block = findBlock(view.state, hit.inside >= 0 ? hit.inside : hit.pos);
  const dom = block && view.nodeDOM(block.pos);
  if (!block || !(dom instanceof HTMLElement)) return null;

  const rect = dom.getBoundingClientRect();
  const box = container.getBoundingClientRect();
  const lineHeight = parseFloat(getComputedStyle(dom).lineHeight) || HANDLE_HEIGHT;
  const firstLine = Math.min(lineHeight, rect.height);
  return {
    pos: block.pos,
    top: rect.top - box.top + Math.max(0, (firstLine - HANDLE_HEIGHT) / 2),
    left: Math.max(0, rect.left - box.left - HANDLE_WIDTH - 4),
    rect,
  };
};

interface MenuItemProps {
  icon: IconType;
  label: string;
  shortcut?: string;
  danger?: boolean;
  trailing?: React.ReactNode;
  onSelect: () => void;
}

const MenuItem = ({ icon: Icon, label, shortcut, danger, trailing, onSelect }: MenuItemProps) => (
  <Flex
    role="menuitem"
    align="center"
    gap={2}
    px={2}
    py={1.5}
    borderRadius="md"
    fontSize="sm"
    cursor="pointer"
    color={danger ? 'fg.error' : undefined}
    _hover={{ bg: 'bg.muted' }}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onSelect}
  >
    <Box color={danger ? 'fg.error' : 'fg.muted'}>
      <Icon />
    </Box>
    <Text flex="1">{label}</Text>
    {shortcut && (
      <Text fontSize="xs" color="fg.subtle">
        {formatShortcut(shortcut)}
      </Text>
    )}
    {trailing}
  </Flex>
);

/**
 * `+` and `⋮⋮` next to the hovered block: `+` adds a block below with the slash menu open,
 * `⋮⋮` drags the block (ProseMirror's own drag and drop) or, clicked, opens the block menu.
 */
export const RichEditorBlockHandle = ({
  editor,
  containerRef,
}: {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [block, setBlock] = useState<HoveredBlock | null>(null);
  const [menu, setMenu] = useState<'closed' | 'open' | 'turnInto'>('closed');
  const menuOpen = useRef(false);
  const lastRect = useRef<DOMRect | null>(null);
  menuOpen.current = menu !== 'closed';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (event: MouseEvent) => {
      if (menuOpen.current || (event.target as HTMLElement).closest('[data-block-handle]')) return;
      const content = editor.view.dom.getBoundingClientRect();
      // In the gutter, stay on the block the pointer came from (the handle lives there).
      if (event.clientX < content.left + 8 && lastRect.current) {
        const { top, bottom } = lastRect.current;
        if (event.clientY >= top && event.clientY <= bottom) return;
      }
      const x = Math.max(event.clientX, content.left + 12);
      const found = blockAt(editor, container, x, event.clientY);
      lastRect.current = found?.rect ?? null;
      setBlock((current) =>
        found && current?.pos === found.pos && current.top === found.top
          ? current
          : found && { pos: found.pos, top: found.top, left: found.left },
      );
    };
    const hide = () => {
      if (!menuOpen.current) setBlock(null);
    };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', hide);
    editor.view.dom.addEventListener('keydown', hide); // typing hides the handle
    return () => {
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', hide);
      editor.view.dom.removeEventListener('keydown', hide);
    };
  }, [editor, containerRef]);

  // Positions shift after any edit; the handle reappears on the next mouse move.
  useEffect(() => {
    const reset = () => {
      if (!menuOpen.current) setBlock(null);
    };
    editor.on('update', reset);
    return () => {
      editor.off('update', reset);
    };
  }, [editor]);

  if (!block || !editor.isEditable) return null;

  const closeMenu = () => {
    setMenu('closed');
    setBlock(null);
  };

  const run = (action: (pos: number) => boolean) => {
    action(block.pos);
    closeMenu();
  };

  const onDragStart = (event: React.DragEvent) => {
    const { view } = editor;
    const selection = NodeSelection.create(view.state.doc, block.pos);
    view.dispatch(view.state.tr.setSelection(selection));
    const slice = selection.content();
    // ProseMirror's drop handler moves the slice and deletes the selected original.
    view.dragging = { slice, move: true };

    const dom = view.nodeDOM(block.pos);
    if (dom instanceof HTMLElement) event.dataTransfer.setDragImage(dom, 0, 0);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(
      'text/plain',
      slice.content.textBetween(0, slice.content.size, '\n'),
    );
  };

  const onDragEnd = () => {
    // Cancelled drags (dropped outside the editor) leave ProseMirror's drag state behind.
    editor.view.dragging = null;
    setBlock(null);
  };

  const node = editor.state.doc.nodeAt(block.pos);
  const canTurnInto = Boolean(node?.isTextblock || node?.firstChild?.isTextblock);

  return (
    <Box
      data-block-handle=""
      position="absolute"
      top={`${block.top}px`}
      left={`${block.left}px`}
      zIndex={10}
      css={{ '@media (hover: none)': { display: 'none' } }}
    >
      <Flex gap={0.5} color="fg.subtle">
        <EditorTooltip label="Add block below">
          <Flex
            as="button"
            aria-label="Add block below"
            w="20px"
            p={0} // index.css pads every <button>
            border="none"
            bg="transparent"
            h={`${HANDLE_HEIGHT}px`}
            align="center"
            justify="center"
            borderRadius="sm"
            _hover={{ bg: 'bg.muted', color: 'fg' }}
            onMouseDown={(event: React.MouseEvent) => event.preventDefault()}
            onClick={() => {
              editor.chain().focus().insertBlockBelow(block.pos).insertContent('/').run();
              setBlock(null);
            }}
          >
            <LuPlus />
          </Flex>
        </EditorTooltip>
        <EditorTooltip label="Drag to move, click for options">
          <Flex
            as="button"
            aria-label="Block options"
            aria-haspopup="menu"
            aria-expanded={menu !== 'closed'}
            draggable
            w="20px"
            p={0} // index.css pads every <button>
            border="none"
            h={`${HANDLE_HEIGHT}px`}
            align="center"
            justify="center"
            borderRadius="sm"
            cursor="grab"
            bg={menu !== 'closed' ? 'bg.muted' : 'transparent'}
            _hover={{ bg: 'bg.muted', color: 'fg' }}
            // No preventDefault on mousedown here: it would stop the native drag.
            onClick={() => setMenu((current) => (current === 'closed' ? 'open' : 'closed'))}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <LuGripVertical />
          </Flex>
        </EditorTooltip>
      </Flex>

      {menu !== 'closed' && (
        <>
          {/* Click outside closes the menu. */}
          <Box position="fixed" inset={0} onMouseDown={closeMenu} />
          <Box
            {...panelProps}
            role="menu"
            position="absolute"
            top={`${HANDLE_HEIGHT + 4}px`}
            left={0}
            minW="15rem"
            p={1}
          >
            {menu === 'turnInto' ? (
              blockCommands
                .filter((command) => command.convertible)
                .map((command) => (
                  <MenuItem
                    key={command.id}
                    icon={command.icon}
                    label={command.label}
                    shortcut={command.shortcut}
                    onSelect={() => {
                      editor
                        .chain()
                        .focus()
                        .setTextSelection(block.pos + 1)
                        .run();
                      command.run(editor);
                      closeMenu();
                    }}
                  />
                ))
            ) : (
              <>
                {canTurnInto && (
                  <MenuItem
                    icon={LuRepeat2}
                    label="Turn into"
                    trailing={<LuChevronRight />}
                    onSelect={() => setMenu('turnInto')}
                  />
                )}
                <MenuItem
                  icon={LuCopy}
                  label="Duplicate"
                  shortcut="Mod-D"
                  onSelect={() => run((pos) => editor.chain().focus().duplicateBlock(pos).run())}
                />
                <MenuItem
                  icon={LuArrowUp}
                  label="Move up"
                  shortcut="Mod-Shift-ArrowUp"
                  onSelect={() => run((pos) => editor.chain().focus().moveBlockUp(pos).run())}
                />
                <MenuItem
                  icon={LuArrowDown}
                  label="Move down"
                  shortcut="Mod-Shift-ArrowDown"
                  onSelect={() => run((pos) => editor.chain().focus().moveBlockDown(pos).run())}
                />
                <Box h="1px" bg="border.muted" my={1} />
                <MenuItem
                  icon={LuTrash2}
                  label="Delete"
                  danger
                  onSelect={() => run((pos) => editor.chain().focus().deleteBlock(pos).run())}
                />
              </>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

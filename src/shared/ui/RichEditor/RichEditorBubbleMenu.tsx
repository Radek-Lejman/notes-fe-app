import { useEffect, useLayoutEffect, useState } from 'react';
import type React from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { useEditorState, type Editor } from '@tiptap/react';
import type { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { Box, Button, Flex, IconButton, Input, Link, Separator, Text } from '@chakra-ui/react';
import {
  LuCheck,
  LuChevronDown,
  LuCornerDownLeft,
  LuEllipsis,
  LuExternalLink,
  LuFileText,
  LuPencil,
  LuSparkles,
  LuUnlink,
} from 'react-icons/lu';
import {
  blockCommands,
  formatShortcut,
  getActiveBlockCommand,
  markCommands,
  type EditorCommand,
} from '../../lib/editor/commands';
import { getSelectionMenuMode } from '../../lib/editor/extensions/EditorUi';
import { applyLink, noteIdFromHref, removeLink } from '../../lib/editor/link';
import { AiPanel } from './AiPanel';
import { panelProps } from './menuStyles';
import { ToolbarButton } from './ToolbarButton';
import type { AskAi } from './types';
import { EditorTooltip } from './EditorTooltip';
import styles from './RichEditor.module.css';
import { useRichEditorContext } from './RichEditorContext';

const MENU_KEY = 'selectionMenu';

// The rest (strikethrough, clear formatting) sits under "More": rarely used, and has shortcuts.
const INLINE_MARKS = ['bold', 'italic', 'code'] as const;

// The plugin only positions the menu (it re-checks this only when the selection or document
// changes). What the menu shows is decided in React by `getSelectionMenuMode`, which also reacts to
// mouseup, Escape and the link editor.
const shouldShow = ({
  editor,
  view,
  element,
}: {
  editor: Editor;
  view: EditorView;
  element: HTMLElement;
  state: EditorState;
}) => editor.isEditable && (view.hasFocus() || element.contains(document.activeElement));

// Buttons never take focus: the editor keeps its focus and selection while formatting.
const keepEditorFocus = (event: React.MouseEvent) => event.preventDefault();

const Dropdown = ({ align, children }: { align: 'start' | 'end'; children: React.ReactNode }) => (
  <Box
    {...panelProps}
    position="absolute"
    top="calc(100% + 6px)"
    {...(align === 'start' ? { left: 0 } : { right: 0 })}
    minW="13rem"
    p={1}
    zIndex={1}
    role="menu"
  >
    {children}
  </Box>
);

const DropdownItem = ({
  command,
  isChecked,
  onSelect,
}: {
  command: EditorCommand;
  isChecked?: boolean;
  onSelect: () => void;
}) => {
  const Icon = command.icon;
  return (
    <Flex
      role="menuitem"
      align="center"
      gap={2}
      px={2}
      py={1.5}
      borderRadius="md"
      fontSize="sm"
      cursor="pointer"
      _hover={{ bg: 'bg.muted' }}
      onMouseDown={keepEditorFocus}
      onClick={onSelect}
    >
      <Box color="fg.muted">
        <Icon />
      </Box>
      <Text flex="1">{command.label}</Text>
      {isChecked && (
        <Box color="blue.fg">
          <LuCheck />
        </Box>
      )}
      {!isChecked && command.shortcut && (
        <Text fontSize="xs" color="fg.subtle">
          {formatShortcut(command.shortcut)}
        </Text>
      )}
    </Flex>
  );
};

const FormatToolbar = ({ editor, askAi }: { editor: Editor; askAi?: AskAi }) => {
  const [openMenu, setOpenMenu] = useState<'turnInto' | 'more' | null>(null);
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: getActiveBlockCommand(e),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      code: e.isActive('code'),
      link: e.isActive('link'),
    }),
  });

  useEffect(() => {
    const close = () => setOpenMenu(null);
    editor.on('selectionUpdate', close);
    return () => {
      editor.off('selectionUpdate', close);
    };
  }, [editor]);

  const toggleMenu = (menu: 'turnInto' | 'more') =>
    setOpenMenu((current) => (current === menu ? null : menu));

  const runAndClose = (command: EditorCommand) => {
    command.run(editor);
    setOpenMenu(null);
  };

  return (
    <Flex {...panelProps} role="toolbar" aria-label="Formatting" align="center" gap={0.5} p={1}>
      <Box position="relative">
        <EditorTooltip label="Turn into">
          <Button
            size="xs"
            variant="ghost"
            aria-haspopup="menu"
            aria-expanded={openMenu === 'turnInto'}
            onMouseDown={keepEditorFocus}
            onClick={() => toggleMenu('turnInto')}
          >
            {active.block.label}
            <LuChevronDown />
          </Button>
        </EditorTooltip>
        {openMenu === 'turnInto' && (
          <Dropdown align="start">
            {blockCommands
              .filter((command) => command.convertible)
              .map((command) => (
                <DropdownItem
                  key={command.id}
                  command={command}
                  isChecked={command.id === active.block.id}
                  onSelect={() => runAndClose(command)}
                />
              ))}
          </Dropdown>
        )}
      </Box>

      <Separator orientation="vertical" h={5} mx={1} />

      {INLINE_MARKS.map((name) => (
        <ToolbarButton
          key={name}
          label={markCommands[name].label}
          shortcut={markCommands[name].shortcut}
          icon={markCommands[name].icon}
          isActive={active[name]}
          onClick={() => markCommands[name].run(editor)}
        />
      ))}
      <ToolbarButton
        label={markCommands.link.label}
        shortcut={markCommands.link.shortcut}
        icon={markCommands.link.icon}
        isActive={active.link}
        onClick={() => editor.chain().focus().extendMarkRange('link').openLinkEditor().run()}
      />

      <Separator orientation="vertical" h={5} mx={1} />

      {askAi && (
        <EditorTooltip label="Ask AI" shortcut="Mod-J">
          <Button
            size="xs"
            variant="ghost"
            colorPalette="blue"
            onMouseDown={keepEditorFocus}
            onClick={() => editor.chain().focus().openAiPanel().run()}
          >
            <LuSparkles />
            AI
          </Button>
        </EditorTooltip>
      )}

      <Box position="relative">
        <ToolbarButton label="More" icon={LuEllipsis} onClick={() => toggleMenu('more')} />
        {openMenu === 'more' && (
          <Dropdown align="end">
            {[markCommands.strike, markCommands.clearFormatting].map((command) => (
              <DropdownItem
                key={command.id}
                command={command}
                onSelect={() => runAndClose(command)}
              />
            ))}
          </Dropdown>
        )}
      </Box>
    </Flex>
  );
};

const LinkEditor = ({ editor }: { editor: Editor }) => {
  const [url, setUrl] = useState(() => String(editor.getAttributes('link').href ?? ''));
  const hasLink = editor.isActive('link');

  const close = () => editor.chain().focus().closeLinkEditor().run();

  return (
    <Flex
      as="form"
      {...panelProps}
      align="center"
      gap={1}
      p={1.5}
      w="22rem"
      maxW="calc(100vw - 16px)"
      onSubmit={(event: React.FormEvent) => {
        event.preventDefault();
        applyLink(editor, url);
      }}
      onBlur={(event: React.FocusEvent<HTMLElement>) => {
        // Focus left the link editor for somewhere outside the editor (e.g. the sidebar).
        if (!event.currentTarget.contains(event.relatedTarget)) editor.commands.closeLinkEditor();
      }}
    >
      <Input
        size="sm"
        autoFocus
        value={url}
        placeholder="Paste or type a link"
        aria-label="Link URL"
        onChange={(event) => setUrl(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            close();
          }
        }}
      />
      <EditorTooltip label="Apply" shortcut="Enter">
        <IconButton type="submit" aria-label="Apply link" size="sm" variant="ghost">
          <LuCornerDownLeft />
        </IconButton>
      </EditorTooltip>
      {hasLink && (
        <EditorTooltip label="Remove link">
          <IconButton
            aria-label="Remove link"
            size="sm"
            variant="ghost"
            onClick={() => removeLink(editor)}
          >
            <LuUnlink />
          </IconButton>
        </EditorTooltip>
      )}
    </Flex>
  );
};

const LinkPreview = ({ editor }: { editor: Editor }) => {
  const href = useEditorState({
    editor,
    selector: ({ editor: e }) => String(e.getAttributes('link').href ?? ''),
  });
  const isNoteLink = noteIdFromHref(href) !== null;

  return (
    <Flex
      {...panelProps}
      align="center"
      gap={1}
      py={1}
      pl={3}
      pr={1}
      maxW="min(26rem, calc(100vw - 16px))"
    >
      {isNoteLink ? (
        <Flex align="center" gap={1.5} fontSize="sm" color="fg.muted" minW={0} flex="1">
          <LuFileText />
          <Text truncate>Link to a note</Text>
        </Flex>
      ) : (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          fontSize="sm"
          color="blue.fg"
          truncate
          minW={0}
          flex="1"
          onMouseDown={keepEditorFocus}
        >
          {href}
        </Link>
      )}
      <ToolbarButton
        label={isNoteLink ? 'Open note' : 'Open link'}
        shortcut="Mod-Click"
        icon={isNoteLink ? LuFileText : LuExternalLink}
        onClick={() => editor.commands.openLink(href)}
      />
      <ToolbarButton
        label="Edit link"
        shortcut={markCommands.link.shortcut}
        icon={LuPencil}
        onClick={() => editor.chain().focus().extendMarkRange('link').openLinkEditor().run()}
      />
      <ToolbarButton label="Remove link" icon={LuUnlink} onClick={() => removeLink(editor)} />
    </Flex>
  );
};

const SelectionMenu = ({ editor, askAi }: { editor: Editor; askAi?: AskAi }) => {
  const mode = useEditorState({ editor, selector: ({ editor: e }) => getSelectionMenuMode(e) });

  // The menu is positioned while empty; place it again once it has its real size.
  useLayoutEffect(() => {
    if (mode && !editor.isDestroyed) {
      editor.view.dispatch(editor.state.tr.setMeta(MENU_KEY, 'updatePosition'));
    }
  }, [editor, mode]);

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={MENU_KEY}
      shouldShow={shouldShow}
      className={styles.selectionMenu}
      options={{ placement: 'top', offset: 8, flip: { padding: 8 }, shift: { padding: 8 } }}
    >
      {mode === 'format' && <FormatToolbar editor={editor} askAi={askAi} />}
      {mode === 'ai' && askAi && <AiPanel editor={editor} askAi={askAi} />}
      {mode === 'linkEdit' && <LinkEditor editor={editor} />}
      {mode === 'linkView' && <LinkPreview editor={editor} />}
    </BubbleMenu>
  );
};

export const RichEditorBubbleMenu = () => {
  const { editor, askAi } = useRichEditorContext();

  if (!editor) return null;

  return <SelectionMenu editor={editor} askAi={askAi} />;
};

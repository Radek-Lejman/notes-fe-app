import { useEffect, useState } from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import { Flex, Separator } from '@chakra-ui/react';
import {
  LuBold,
  LuChevronDown,
  LuHeading2,
  LuIndentDecrease,
  LuIndentIncrease,
  LuItalic,
  LuLink,
  LuList,
  LuListTodo,
  LuPlus,
  LuSparkles,
  LuUndo2,
} from 'react-icons/lu';
import { ToolbarButton } from './ToolbarButton';
import { useRichEditorContext } from './RichEditorContext';

const COARSE_POINTER = '(pointer: coarse)';

const useCoarsePointer = () => {
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(COARSE_POINTER).matches === true,
  );
  useEffect(() => {
    const query = window.matchMedia?.(COARSE_POINTER);
    if (!query) return;
    const update = () => setCoarse(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return coarse;
};

/** Height of the on-screen keyboard (what it covers at the bottom of the layout viewport). */
const useKeyboardInset = () => {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () =>
      setInset(Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop)));
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);
  return inset;
};

const ToolbarContent = ({ editor }: { editor: Editor }) => {
  const { askAi } = useRichEditorContext();
  const inset = useKeyboardInset();
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      focused: e.isFocused,
      heading: e.isActive('heading'),
      bulletList: e.isActive('bulletList'),
      taskList: e.isActive('taskList'),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      link: e.isActive('link'),
      listItem: e.isActive('taskItem') ? 'taskItem' : e.isActive('listItem') ? 'listItem' : null,
      emptyBlock: e.state.selection.$from.parent.content.size === 0,
    }),
  });

  if (!state.focused) return null;

  const chain = () => editor.chain().focus();

  return (
    <Flex
      role="toolbar"
      aria-label="Formatting"
      position="fixed"
      left={0}
      right={0}
      bottom={`${inset}px`}
      zIndex={1400}
      bg="bg.panel"
      borderTopWidth="1px"
      borderColor="border"
      boxShadow="0 -4px 12px rgba(0, 0, 0, 0.06)"
      px={1}
      pt={1}
      pb={inset > 0 ? 1 : 'calc(4px + env(safe-area-inset-bottom, 0px))'}
      gap={0.5}
      align="center"
      overflowX="auto"
      css={{ scrollbarWidth: 'none' }}
    >
      <ToolbarButton
        size="md"
        label="Insert block"
        icon={LuPlus}
        onClick={() =>
          (state.emptyBlock ? chain() : chain().insertBlockBelow()).insertContent('/').run()
        }
      />
      {askAi && (
        <ToolbarButton
          size="md"
          label="Ask AI"
          icon={LuSparkles}
          onClick={() => chain().openAiPanel().run()}
        />
      )}
      <Separator orientation="vertical" h={6} />
      <ToolbarButton
        size="md"
        label="Heading"
        icon={LuHeading2}
        isActive={state.heading}
        onClick={() =>
          (state.heading ? chain().setParagraph() : chain().setHeading({ level: 2 })).run()
        }
      />
      <ToolbarButton
        size="md"
        label="Bulleted list"
        icon={LuList}
        isActive={state.bulletList}
        onClick={() => chain().toggleBulletList().run()}
      />
      <ToolbarButton
        size="md"
        label="To-do list"
        icon={LuListTodo}
        isActive={state.taskList}
        onClick={() => chain().toggleTaskList().run()}
      />
      <Separator orientation="vertical" h={6} />
      <ToolbarButton
        size="md"
        label="Bold"
        icon={LuBold}
        isActive={state.bold}
        onClick={() => chain().toggleBold().run()}
      />
      <ToolbarButton
        size="md"
        label="Italic"
        icon={LuItalic}
        isActive={state.italic}
        onClick={() => chain().toggleItalic().run()}
      />
      <ToolbarButton
        size="md"
        label="Link"
        icon={LuLink}
        isActive={state.link}
        onClick={() => chain().extendMarkRange('link').openLinkEditor().run()}
      />
      {state.listItem && (
        <>
          <Separator orientation="vertical" h={6} />
          <ToolbarButton
            size="md"
            label="Outdent"
            icon={LuIndentDecrease}
            onClick={() =>
              chain()
                .liftListItem(state.listItem ?? 'listItem')
                .run()
            }
          />
          <ToolbarButton
            size="md"
            label="Indent"
            icon={LuIndentIncrease}
            onClick={() =>
              chain()
                .sinkListItem(state.listItem ?? 'listItem')
                .run()
            }
          />
        </>
      )}
      <Separator orientation="vertical" h={6} />
      <ToolbarButton size="md" label="Undo" icon={LuUndo2} onClick={() => chain().undo().run()} />
      <ToolbarButton
        size="md"
        label="Hide keyboard"
        icon={LuChevronDown}
        onClick={() => editor.commands.blur()}
      />
    </Flex>
  );
};

/**
 * Formatting bar docked above the on-screen keyboard on touch devices, where a menu over the
 * selection would fight the system's own selection menu.
 */
export const RichEditorMobileToolbar = ({ editor }: { editor: Editor }) => {
  const coarse = useCoarsePointer();
  if (!coarse || !editor.isEditable) return null;
  return <ToolbarContent editor={editor} />;
};

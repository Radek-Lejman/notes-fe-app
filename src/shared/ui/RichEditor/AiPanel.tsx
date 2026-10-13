import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { Editor } from '@tiptap/react';
import { Box, Button, Flex, Input, Kbd, Spinner, Text } from '@chakra-ui/react';
import {
  LuCheck,
  LuCornerDownLeft,
  LuLanguages,
  LuLightbulb,
  LuListCollapse,
  LuPenLine,
  LuSparkles,
  LuSpellCheck,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';
import {
  applyAiAnswer,
  getAiText,
  type AiAssistAction,
  type AiAssistRequest,
} from '../../lib/editor/ai';
import { MarkdownView } from '../MarkdownView';
import { panelProps } from './menuStyles';
import type { AskAi } from './types';

interface QuickAction {
  action: AiAssistAction;
  label: string;
  icon: IconType;
}

const SELECTION_ACTIONS: QuickAction[] = [
  { action: 'improve', label: 'Improve writing', icon: LuPenLine },
  { action: 'fix', label: 'Fix spelling & grammar', icon: LuSpellCheck },
  { action: 'summarize', label: 'Summarize', icon: LuListCollapse },
  { action: 'explain', label: 'Explain', icon: LuLightbulb },
  { action: 'translate', label: 'Translate', icon: LuLanguages },
];

const CURSOR_ACTIONS: QuickAction[] = [
  { action: 'continue', label: 'Continue writing', icon: LuPenLine },
];

const ACTION_LABELS: Record<AiAssistAction, string> = {
  improve: 'Improve writing',
  fix: 'Fix spelling & grammar',
  summarize: 'Summarize',
  explain: 'Explain',
  translate: 'Translate',
  continue: 'Continue writing',
  custom: 'Ask AI',
};

type PanelState =
  | { status: 'idle' }
  | { status: 'loading'; request: AiAssistRequest }
  | { status: 'done'; request: AiAssistRequest; answer: string }
  | { status: 'error'; request?: AiAssistRequest; message: string };

const keepEditorFocus = (event: React.MouseEvent) => event.preventDefault();

/**
 * Ask AI on the selection (or at the cursor): pick an action or type an instruction, review the
 * answer, then replace the selection or insert it. Nothing changes in the note before that.
 */
export const AiPanel = ({ editor, askAi }: { editor: Editor; askAi: AskAi }) => {
  const [hasSelection] = useState(() => {
    const range = editor.storage.editorUi.aiRange;
    return Boolean(range && range.from !== range.to);
  });
  const [instruction, setInstruction] = useState('');
  const [state, setState] = useState<PanelState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // A click outside the panel and the editor (e.g. the sidebar) closes it. Clicks in the editor
  // close it through the EditorUi plugin; focus is not used because inputs come and go here.
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || panelRef.current?.contains(target) || editor.view.dom.contains(target)) return;
      abortRef.current?.abort();
      editor.commands.closeAiPanel();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [editor]);

  const close = () => {
    abortRef.current?.abort();
    editor.chain().focus().closeAiPanel().run();
  };

  const run = (request: Omit<AiAssistRequest, 'text'>) => {
    const range = editor.storage.editorUi.aiRange;
    if (!range) return;
    const full: AiAssistRequest = { ...request, text: getAiText(editor, range) };
    if (!full.text && full.action !== 'custom') {
      setState({ status: 'error', message: 'There is no text to work with yet.' });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: 'loading', request: full });

    askAi(full, controller.signal)
      .then((answer) => {
        if (!controller.signal.aborted) setState({ status: 'done', request: full, answer });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Ask AI failed. Try again.';
        setState({ status: 'error', request: full, message });
      });
  };

  const apply = (placement: 'replace' | 'below') => {
    const range = editor.storage.editorUi.aiRange;
    if (range && state.status === 'done') applyAiAnswer(editor, state.answer, range, placement);
  };

  const retry = () => {
    if (state.status !== 'idle' && state.request) run(state.request);
  };

  const quickActions = hasSelection ? SELECTION_ACTIONS : CURSOR_ACTIONS;

  return (
    <Flex
      ref={panelRef}
      {...panelProps}
      direction="column"
      gap={2}
      p={2}
      w="28rem"
      maxW="calc(100vw - 16px)"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          close();
        }
      }}
    >
      <Flex align="center" gap={2} px={1} fontSize="xs" color="fg.muted">
        <Box color="blue.fg">
          <LuSparkles />
        </Box>
        <Text fontWeight="semibold" color="fg">
          {state.status === 'idle' ? 'Ask AI' : ACTION_LABELS[state.request?.action ?? 'custom']}
        </Text>
        <Text>{hasSelection ? 'on the selected text' : 'at the cursor'}</Text>
      </Flex>

      {state.status === 'loading' && (
        <Flex align="center" gap={2} px={1} py={2} fontSize="sm" color="fg.muted">
          <Spinner size="xs" />
          <Text flex="1">Thinking…</Text>
          <Button size="xs" variant="ghost" autoFocus onClick={close}>
            Cancel
          </Button>
        </Flex>
      )}

      {state.status === 'done' && (
        <>
          <Box
            maxH="16rem"
            overflowY="auto"
            px={3}
            py={2}
            borderRadius="md"
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border.muted"
            fontSize="sm"
          >
            <MarkdownView markdown={state.answer} />
          </Box>
          <Flex gap={1.5} wrap="wrap">
            <Button size="xs" colorPalette="blue" autoFocus onClick={() => apply('replace')}>
              <LuCheck />
              {hasSelection ? 'Replace selection' : 'Insert'}
              <Kbd size="sm" variant="plain" color="inherit">
                ↵
              </Kbd>
            </Button>
            {hasSelection && (
              <Button size="xs" variant="outline" onClick={() => apply('below')}>
                Insert below
              </Button>
            )}
            <Button size="xs" variant="ghost" onClick={retry}>
              Try again
            </Button>
            <Button size="xs" variant="ghost" onClick={close}>
              Discard
            </Button>
          </Flex>
        </>
      )}

      {state.status === 'error' && (
        <Flex align="center" gap={2} px={1} fontSize="sm">
          <Text flex="1" color="fg.error">
            {state.message}
          </Text>
          {state.request && (
            <Button size="xs" variant="ghost" onClick={retry}>
              Try again
            </Button>
          )}
        </Flex>
      )}

      {(state.status === 'idle' || state.status === 'error') && (
        <>
          <Flex
            as="form"
            align="center"
            gap={1}
            onSubmit={(event: React.FormEvent) => {
              event.preventDefault();
              if (instruction.trim()) run({ action: 'custom', instruction: instruction.trim() });
            }}
          >
            <Input
              size="sm"
              autoFocus
              value={instruction}
              placeholder={
                hasSelection ? 'Ask AI to edit or explain the selection…' : 'Ask AI to write…'
              }
              aria-label="Instruction for AI"
              onChange={(event) => setInstruction(event.target.value)}
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              aria-label="Ask AI"
              disabled={!instruction.trim()}
            >
              <LuCornerDownLeft />
            </Button>
          </Flex>
          <Flex gap={1.5} wrap="wrap">
            {quickActions.map(({ action, label, icon: Icon }) => (
              <Button
                key={action}
                size="xs"
                variant="outline"
                onMouseDown={keepEditorFocus}
                onClick={() => run({ action })}
              >
                <Icon />
                {label}
              </Button>
            ))}
          </Flex>
        </>
      )}
    </Flex>
  );
};

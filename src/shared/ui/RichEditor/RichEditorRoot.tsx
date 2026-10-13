import { useCallback, useEffect, useRef, useState } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { useEditor } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import type { Editor } from '@tiptap/core';
import type { Node as PmNode } from '@tiptap/pm/model';
import { SlashCommand } from '../../lib/editor/extensions/SlashCommand';
import { EditorUi } from '../../lib/editor/extensions/EditorUi';
import { BlockActions } from '../../lib/editor/extensions/BlockActions';
import type { AiAssistRequest } from '../../lib/editor/ai';
import { createSuggestionOptions } from '../../lib/editor/extensions/suggestion';
import {
  createMarkdownExtensions,
  getEditorMarkdown,
  SafeMarkdown,
} from '../../lib/editor/markdown';
import { type CustomSlashMenuItem, type RootProps } from './types';
import { RichEditorContext } from './RichEditorContext';
import { RichEditorShortcutsDialog } from './RichEditorShortcutsDialog';

const placeholderFor =
  (paragraphPlaceholder: string) =>
  ({ editor, node, pos }: { editor: Editor; node: PmNode; pos: number }) => {
    if (node.type.name === 'heading') return `Heading ${String(node.attrs.level)}`;
    if (node.type.name !== 'paragraph') return '';
    const parent = editor.state.doc.resolve(pos).parent.type.name;
    if (parent === 'listItem' || parent === 'taskItem') return 'List';
    if (parent === 'blockquote') return 'Quote';
    return paragraphPlaceholder;
  };

const askAiSlashItem: CustomSlashMenuItem = {
  label: 'Ask AI',
  value: 'ask_ai',
  description: 'Write, continue or explain with AI',
  icon: LuSparkles,
  group: 'AI',
  shortcut: 'Mod-J',
  keywords: ['ai', 'write', 'continue', 'claude', 'assistant'],
  action: (editor) => editor.commands.openAiPanel(),
};

export const RichEditorRoot = ({
  value = '',
  onChange,
  onSave,
  onOpenNote,
  onAskAi,
  autoFocus = false,
  placeholder = "Type '/' for commands",
  className = '',
  children,
  customSlashItems = [],
  extensions = [],
}: RootProps) => {
  const [isShortcutsOpen, setShortcutsOpen] = useState(false);

  // The editor is created once; its extensions read the latest callbacks through refs.
  const callbacks = useRef({ onSave, onOpenNote, onAskAi });
  useEffect(() => {
    callbacks.current = { onSave, onOpenNote, onAskAi };
  }, [onSave, onOpenNote, onAskAi]);

  // Read once, like the extensions: whether this editor offers Ask AI at all.
  const [aiEnabled] = useState(() => Boolean(onAskAi));
  const askAi = useCallback((request: AiAssistRequest, signal: AbortSignal) => {
    const run = callbacks.current.onAskAi;
    if (!run) return Promise.reject(new Error('Ask AI is not available'));
    return run(request, signal);
  }, []);

  const editor = useEditor({
    extensions: [
      ...extensions,
      SafeMarkdown,
      ...createMarkdownExtensions(),
      Placeholder.configure({ includeChildren: true, placeholder: placeholderFor(placeholder) }),
      CharacterCount,
      EditorUi.configure({
        onSave: () => callbacks.current.onSave?.(),
        onShowShortcuts: () => setShortcutsOpen(true),
        onOpenNote: (noteId) => {
          const open = callbacks.current.onOpenNote;
          if (open) open(noteId);
          else window.open(`/note/${noteId}`, '_blank', 'noopener,noreferrer');
        },
        aiEnabled,
      }),
      BlockActions,
      SlashCommand.configure({
        suggestion: createSuggestionOptions(
          aiEnabled ? [...customSlashItems, askAiSlashItem] : customSlashItems,
        ),
      }),
    ],
    // `value` is read once: the editor owns the document afterwards. Remount (key) to load another
    // note; feeding saved values back in would overwrite what was typed while saving.
    content: value,
    contentType: 'markdown',
    editable: true,
    autofocus: autoFocus,
    immediatelyRender: false,
    editorProps: {
      attributes: { 'aria-label': 'Note content' },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => onChange(getEditorMarkdown(editor));
    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, onChange]);

  return (
    <RichEditorContext.Provider
      value={{ editor, isShortcutsOpen, setShortcutsOpen, askAi: aiEnabled ? askAi : undefined }}
    >
      <div className={className}>{children}</div>
      <RichEditorShortcutsDialog />
    </RichEditorContext.Provider>
  );
};

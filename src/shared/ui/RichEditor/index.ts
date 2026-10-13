import { RichEditorRoot } from './RichEditorRoot';
import { RichEditorContent } from './RichEditorContent';
import { RichEditorTitle } from './RichEditorTitle';
import { RichEditorBubbleMenu } from './RichEditorBubbleMenu';
import { RichEditorShortcutsButton, RichEditorWordCount } from './RichEditorStatus';

export const RichEditor = {
  Root: RichEditorRoot,
  Content: RichEditorContent,
  Title: RichEditorTitle,
  BubbleMenu: RichEditorBubbleMenu,
  WordCount: RichEditorWordCount,
  ShortcutsButton: RichEditorShortcutsButton,
};

export { useRichEditorContext } from './RichEditorContext';

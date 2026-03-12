import { RichEditorRoot } from "./RichEditorRoot";
import { RichEditorContent } from "./RichEditorContent";
import { RichEditorTitle } from "./RichEditorTitle";
import { RichEditorBubbleMenu } from "./RichEditorBubbleMenu";

export const RichEditor = {
  Root: RichEditorRoot,
  Content: RichEditorContent,
  Title: RichEditorTitle,
  BubbleMenu: RichEditorBubbleMenu,
};

export { useRichEditorContext } from "./RichEditorRoot";

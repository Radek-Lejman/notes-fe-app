import { RichEditorRoot } from "./RichEditorRoot";
import { RichEditorContent } from "./RichEditorContent";
import { RichEditorDropdown } from "./RichEditorDropdown";
import { RichEditorTitle } from "./RichEditorTitle";

export const RichEditor = {
  Root: RichEditorRoot,
  Content: RichEditorContent,
  Dropdown: RichEditorDropdown,
  Title: RichEditorTitle,
};

export { useRichEditorContext } from "./RichEditorRoot";

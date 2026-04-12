import { createContext, useContext } from "react";
import type { RichEditorContextValue } from "./types";

export const RichEditorContext = createContext<RichEditorContextValue>({
  editor: null,
});

export const useRichEditorContext = (): RichEditorContextValue => {
  return useContext(RichEditorContext);
};

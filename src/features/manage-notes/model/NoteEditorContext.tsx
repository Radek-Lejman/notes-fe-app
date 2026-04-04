import { createContext, useContext } from "react";
import { type JSONContent } from "@tiptap/react";

export interface NoteEditorContextValue {
  commitEditorState: (immediateContent?: JSONContent) => void;
}

export const NoteEditorContext = createContext<NoteEditorContextValue | null>(null);

export const useNoteEditorContext = () => {
  const context = useContext(NoteEditorContext);
  if (!context) {
    throw new Error("useNoteEditorContext must be used within a NoteEditorForm");
  }
  return context;
};

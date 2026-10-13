import { createContext, useContext } from 'react';

export interface NoteEditorContextValue {
  commitEditorState: (immediateContent?: string) => void;
}

export const NoteEditorContext = createContext<NoteEditorContextValue | null>(null);

export const useNoteEditorContext = () => {
  const context = useContext(NoteEditorContext);
  if (!context) {
    throw new Error('useNoteEditorContext must be used within a NoteEditorForm');
  }
  return context;
};

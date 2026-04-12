import { createContext, useContext } from 'react';
import type { useNoteSearch } from '../model/useNoteSearch';

type NoteSearchContextValue = ReturnType<typeof useNoteSearch> & {
  onItemSelect?: (noteId: string) => void;
};

export const NoteSearchContext = createContext<NoteSearchContextValue | null>(null);

export function useNoteSearchContext() {
  const context = useContext(NoteSearchContext);
  if (!context) {
    throw new Error('useNoteSearchContext must be used within a NoteSearch.Root');
  }
  return context;
}

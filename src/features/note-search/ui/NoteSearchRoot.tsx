import React from "react";
import { Box } from "@chakra-ui/react";
import { NoteSearchContext } from "./NoteSearchContext";
import { useNoteSearch } from "../model/useNoteSearch";
import type { SearchFilters } from "../model/types";

interface NoteSearchRootProps {
  children: React.ReactNode;
  initialFilters?: SearchFilters;
  onItemSelect?: (noteId: string) => void;
}

export function NoteSearchRoot({ children, initialFilters, onItemSelect }: NoteSearchRootProps) {
  const searchValues = useNoteSearch(initialFilters);
  const contextValue = React.useMemo(() => ({ ...searchValues, onItemSelect }), [searchValues, onItemSelect]);

  return (
    <NoteSearchContext.Provider value={contextValue}>
      <Box w="full" maxW="900px" mx="auto">{children}</Box>
    </NoteSearchContext.Provider>
  );
}

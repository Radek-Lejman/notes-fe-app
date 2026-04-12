import { Input } from '@chakra-ui/react';
import { useNoteSearchContext } from './NoteSearchContext';
import type { NoteSearchInputProps } from '../model/types';

export function NoteSearchInput({ placeholder = 'Search notes...' }: NoteSearchInputProps) {
  const { query, setQuery } = useNoteSearchContext();
  return (
    <Input
      placeholder={placeholder}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      borderRadius="md"
      w="full"
      mb={3}
    />
  );
}

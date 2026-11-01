import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NotesApi } from '../notesApi';
import { noteKeys } from '../notesKeys';

/** Imports many files as a note tree; a real import (not a dry run) refreshes every note query. */
export const useImportNotes = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: NotesApi.importNotes,
    onSuccess: (result) => {
      if (!result.dryRun) return client.invalidateQueries({ queryKey: noteKeys.notes.all() });
    },
  });
};

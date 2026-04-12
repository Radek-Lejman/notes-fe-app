import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NotesApi } from '../notesApi';
import { noteKeys } from '../notesKeys';
import type { Notes } from '../../model/types';

export const useUpdateNote = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: NotesApi.updateNote,

    onSuccess: (updatedNote: Notes) => {
      client.setQueryData(noteKeys.notes.detail(updatedNote.id), updatedNote);
      client.setQueryData(noteKeys.notes.list(), (oldData: Notes[] | undefined) => {
        if (!oldData) return [updatedNote];
        return oldData.map((note) => (note.id === updatedNote.id ? updatedNote : note));
      });
    },
  });
};

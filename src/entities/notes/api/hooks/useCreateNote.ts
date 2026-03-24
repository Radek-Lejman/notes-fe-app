import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotesApi, noteKeys, type Notes } from "@entities/notes";

export const useCreateNote = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: NotesApi.createNote,
    onSuccess: (newNote: Notes) => {
      client.setQueryData(noteKeys.notes.detail(newNote.id), newNote);
      client.setQueryData(noteKeys.notes.list(), (oldData: Notes[] | undefined) => {
        if (!oldData) return [newNote];
        return [...oldData, newNote];
      });
    },
  });
};
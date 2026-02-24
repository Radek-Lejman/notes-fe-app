import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotesApi, noteKeys } from "@entities/notes";

export const useCreateNote = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: NotesApi.createNote,

    onSuccess: () => {
      client.invalidateQueries({ queryKey: noteKeys.notes.list() });
    },
  });
};
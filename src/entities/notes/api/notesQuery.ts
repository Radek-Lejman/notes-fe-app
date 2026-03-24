import { queryOptions } from "@tanstack/react-query";
import { noteKeys } from "./notesKeys";
import { NotesApi } from "./notesApi";

export const noteQueries = {
  list: () => queryOptions({
    queryKey: noteKeys.notes.list(),
    queryFn: () => NotesApi.getNotes(),
  }),

  detail: (id: string) => queryOptions({
    queryKey: noteKeys.notes.detail(id),
    queryFn: () => NotesApi.getNote(id),
    enabled: !!id, 
  }),

  search: (text: string) => queryOptions({
    queryKey: noteKeys.notes.search(text),
    queryFn: () => NotesApi.searchNote({ text }),
    enabled: text.length > 2, 
  }),
};
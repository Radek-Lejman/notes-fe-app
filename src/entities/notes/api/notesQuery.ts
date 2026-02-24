import { queryOptions } from "@tanstack/react-query";
import { noteKeys } from "./notesKeys";
import { NotesApi } from "./notesApi";



export const noteQueries = {
  // Pobranie wszystkich (lub z filtrami)
  list: () => queryOptions({
    queryKey: noteKeys.notes.list(),
    queryFn: () => NotesApi.getNotes(),
  }),

  // Szczegóły
  detail: (id: string) => queryOptions({
    queryKey: noteKeys.notes.detail(id),
    queryFn: () => NotesApi.getNote(id),
    enabled: !!id, // Zabezpieczenie: nie pobieraj, jak nie ma ID
  }),

  // Wyszukiwanie
  search: (text: string) => queryOptions({
    queryKey: noteKeys.notes.search(text), // Używamy klucza listy z filtrem!
    queryFn: () => NotesApi.searchNote({ text }),
    enabled: text.length > 2, // Pobieraj dopiero jak wpisze 3 znaki
  }),
};
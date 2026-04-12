import { useSuspenseQuery } from "@tanstack/react-query";
import { noteQueries } from "../notesQuery";

export const useSearchNote = (text: string) =>
  useSuspenseQuery(noteQueries.search(text));
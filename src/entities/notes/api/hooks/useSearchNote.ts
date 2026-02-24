import { useSuspenseQuery } from "@tanstack/react-query";
import { noteQueries } from "@entities/notes";

export const useSearchNote = (text: string) =>
  useSuspenseQuery(noteQueries.search(text));
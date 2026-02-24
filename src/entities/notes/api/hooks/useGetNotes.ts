import { useSuspenseQuery } from "@tanstack/react-query";
import { noteQueries } from "@entities/notes";

export const useGetNotes = () =>
  useSuspenseQuery(noteQueries.list());

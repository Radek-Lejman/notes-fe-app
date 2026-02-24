import { useSuspenseQuery } from "@tanstack/react-query";
import { noteQueries } from "@entities/notes";

export const useGetNote = (id: string) => {
  return useSuspenseQuery(noteQueries.detail(id));
};
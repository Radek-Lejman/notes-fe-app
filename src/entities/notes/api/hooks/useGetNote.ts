import { useSuspenseQuery } from '@tanstack/react-query';
import { noteQueries } from '../notesQuery';

export const useGetNote = (id: string) => {
  return useSuspenseQuery(noteQueries.detail(id));
};

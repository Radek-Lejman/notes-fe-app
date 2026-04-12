import { useSuspenseQuery } from '@tanstack/react-query';
import { noteQueries } from '../notesQuery';

export const useGetNotes = () => useSuspenseQuery(noteQueries.list());

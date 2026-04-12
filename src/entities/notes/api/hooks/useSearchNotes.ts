import { useQuery } from '@tanstack/react-query';
import { NotesApi } from '../notesApi';
import type { SearchNotesParams } from '../../model/types';
import { MINUTE_IN_MS } from '@/shared/lib/utils/time';

export function useSearchNotes(params: SearchNotesParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['notes', 'search', params],
    queryFn: () => NotesApi.searchNote(params),
    enabled,
    staleTime: 5 * MINUTE_IN_MS,
  });
}

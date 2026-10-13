import { apiClient } from '@shared/api/axios/client';
import type {
  Notes,
  NoteSearchHit,
  SearchNotesParams,
  CreateNoteDto,
  UpdateNoteDto,
} from '../model/types';

export const NotesApi = {
  getNotes: async (): Promise<Notes[]> => {
    const { data } = await apiClient.get<Notes[]>('/notes');
    return data;
  },

  getNote: async (id: string): Promise<Notes> => {
    const { data } = await apiClient.get<Notes>(`/notes/${id}`);
    return data;
  },

  createNote: async (payload: CreateNoteDto): Promise<Notes> => {
    const { data } = await apiClient.post<Notes>('/notes', payload);
    return data;
  },

  updateNote: async (payload: UpdateNoteDto): Promise<Notes> => {
    const { id, ...dataPayload } = payload;
    const { data } = await apiClient.patch<Notes>(`/notes/${id}`, dataPayload);
    return data;
  },

  searchNote: async (payload: SearchNotesParams): Promise<NoteSearchHit[]> => {
    const { data } = await apiClient.get<NoteSearchHit[]>('/notes/search', {
      params: payload,
    });
    return data;
  },
};

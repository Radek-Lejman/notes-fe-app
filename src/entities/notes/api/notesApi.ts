import { apiClient } from '@shared/api/axios/client';
import type {
  Notes,
  NoteSearchHit,
  SearchNotesParams,
  CreateNoteDto,
  UpdateNoteDto,
} from '../model/types';
import type { ImportNotesDto, ImportResult } from '../model/import.types';

// Up to 2000 notes written in one transaction, after uploading up to 25 MB.
const IMPORT_TIMEOUT_MS = 2 * 60 * 1000;

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

  importNotes: async (payload: ImportNotesDto): Promise<ImportResult> => {
    const { data } = await apiClient.post<ImportResult>('/notes/import', payload, {
      timeout: IMPORT_TIMEOUT_MS,
    });
    return data;
  },
};

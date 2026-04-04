import { apiClient } from "@shared/api/axios/client";
import type { Notes, SearchNotesParams, CreateNoteDto, UpdateNoteDto } from "../model/types";

export const NotesApi = {
  getNotes: async (): Promise<Notes[]> => {
    const { data } = await apiClient.get("/notes");
    return data;
  },

  getNote: async (id: string): Promise<Notes> => {
    const { data } = await apiClient.get(`/notes/${id}`);
    return data;
  },

  createNote: async (payload: CreateNoteDto) => {
    const { data } = await apiClient.post("/notes", payload);
    return data;
  },

  updateNote: async (payload: UpdateNoteDto) => {
    const { id, ...dataPayload } = payload;
    const { data } = await apiClient.patch(`/notes/${id}`, dataPayload);
    return data;
  },

  searchNote: async (payload: SearchNotesParams): Promise<Notes[]> => {
    const { data } = await apiClient.get<Notes[]>("/notes/search", {
      params: payload,
    });
    return data;
  },
};

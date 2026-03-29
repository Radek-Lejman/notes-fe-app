import { apiClient } from "@shared/api/axios/client";
import type { Notes, SearchNotesParams } from "../model/types";
import type { JSONContent } from "@tiptap/core";

export const NotesApi = {
  getNotes: async (): Promise<Notes[]> => {
    const { data } = await apiClient.get("/notes");
    return data;
  },

  getNote: async (id: string): Promise<Notes> => {
    const { data } = await apiClient.get(`/notes/${id}`);
    return data;
  },

  createNote: async (payload: { title: string; content: JSONContent }) => {
    const { data } = await apiClient.post("/notes", payload);
    return data;
  },

  updateNote: async (payload: { id: string; title: string; content: JSONContent | null }) => {
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

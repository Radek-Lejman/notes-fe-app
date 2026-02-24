import { apiClient } from "@shared/api/axios/client";
import type { Notes } from "../model/types";

export const NotesApi = {
  getNotes: async (): Promise<Notes[]> => {
    const { data } = await apiClient.get("/nodtes");
    return data;
  },

  getNote: async (id: string): Promise<Notes> => {
    const { data } = await apiClient.get(`/notes/${id}`);
    return data;
  },

  createNote: async (payload: { title: string; content: string }) => {
    const { data } = await apiClient.post("/notes", payload);
    return data;
  },
  searchNote: async (payload: { text: string }) => {
    const { data } = await apiClient.get(`/notes/search`, {
      params: { q: payload.text },
    });
    return data;
  },
};

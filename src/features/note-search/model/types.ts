import type { SearchNotesParams } from "@entities/notes";

export type NoteFieldsPreset =
  | "title"
  | "title,content"
  | "title,updatedAt"
  | "title,content,updatedAt";

export type SearchFilters = Omit<SearchNotesParams, "q">;


export interface NoteSearchInputProps {
  placeholder?: string;
}

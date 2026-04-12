import type { JSONContent } from '@tiptap/core';

export interface CreateNoteDto {
  title: string;
  content: JSONContent;
  parentId?: string | null;
}

export interface UpdateNoteDto extends CreateNoteDto {
  id: string;
}

export interface Notes {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
}

export interface SearchNotesParams {
  q: string;
  cursor?: string;
  limit?: number;
  fields?: string;
  order?:
    | 'rank'
    | '-rank'
    | 'createdAt'
    | '-createdAt'
    | 'title'
    | '-title'
    | 'updatedAt'
    | '-updatedAt';
}

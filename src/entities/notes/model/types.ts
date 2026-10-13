export interface CreateNoteDto {
  title: string;
  /** Markdown. */
  content: string;
  parentId?: string | null;
}

export interface UpdateNoteDto extends CreateNoteDto {
  id: string;
}

export interface Notes {
  id: string;
  title: string;
  /** Markdown; left out of lists and of child notes unless requested. */
  content?: string;
  createdAt: string;
  parentId?: string | null;
}

/** A search hit: the requested fields plus a plain-text excerpt around the match. */
export interface NoteSearchHit extends Partial<Notes> {
  id: string;
  snippet: string;
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

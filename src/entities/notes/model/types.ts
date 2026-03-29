export interface Notes {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface SearchNotesParams {
  q: string;
  cursor?: string;
  limit?: number;
  fields?: string;
  order?:
    | "rank"
    | "-rank"
    | "createdAt"
    | "-createdAt"
    | "title"
    | "-title"
    | "updatedAt"
    | "-updatedAt";
}

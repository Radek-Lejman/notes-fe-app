export const noteKeys = {
  notes: {
    all: () => ["notes"] as const,
    list: () => ["notes", "list"] as const,
    detail: (id: string) => ["notes", "detail", id] as const,
    search: (text: string) => ["notes", "search", text] as const,
  },
};
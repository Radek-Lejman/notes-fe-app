export interface Searchable {
  label: string;
  keywords?: string[];
}

const score = (term: string, query: string): number => {
  const value = term.toLowerCase();
  if (value === query) return 4;
  if (value.startsWith(query)) return 3;
  if (value.split(/\s+/).some((word) => word.startsWith(query))) return 2;
  return value.includes(query) ? 1 : 0;
};

/**
 * Items matching the query by label or keyword, best match first: exact, prefix, word prefix,
 * substring. Ties keep the original order. An empty query returns every item unchanged.
 */
export const rankByQuery = <T extends Searchable>(items: T[], query: string): T[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;

  return items
    .map((item, index) => ({
      item,
      index,
      score: Math.max(...[item.label, ...(item.keywords ?? [])].map((t) => score(t, normalized))),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
};

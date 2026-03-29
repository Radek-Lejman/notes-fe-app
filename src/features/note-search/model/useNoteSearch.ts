import { useState } from "react";
import { useSearchNotes } from "@/entities/notes";
import { useDebounce } from "@/shared/lib/hooks/useDebounce";
import type { SearchFilters } from "../model/types";
import { DEFAULT_SEARCH_FILTERS } from "../config/constants";

export function useNoteSearch(initialFilters: SearchFilters = DEFAULT_SEARCH_FILTERS) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  const { data, isLoading, isError, error } = useSearchNotes(
    { q: debouncedQuery, ...filters },
    debouncedQuery.trim().length > 0
  );

  return {
    query,
    setQuery,
    debouncedQuery,
    filters,
    setFilters: (newFilters: Partial<SearchFilters>) => setFilters((prev) => ({ ...prev, ...newFilters })),
    results: data || [],
    isLoading,
    isError,
    error,
  };
}

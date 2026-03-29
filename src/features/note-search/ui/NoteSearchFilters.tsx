import type { ChangeEvent } from "react";
import { Flex } from "@chakra-ui/react";
import { useNoteSearchContext } from "./NoteSearchContext";
import type { SearchFilters } from "../model/types";
import { 
  SEARCH_ORDER_OPTIONS, 
  SEARCH_LIMIT_OPTIONS, 
  SEARCH_FIELDS_OPTIONS,
  DEFAULT_SEARCH_FILTERS
} from "../config/constants";

export function NoteSearchFilters() {
  const { filters, setFilters } = useNoteSearchContext();

  return (
    <Flex gap={3} w="full" mb={4}>
      <select
        value={filters.order || DEFAULT_SEARCH_FILTERS.order}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilters({ order: e.target.value as SearchFilters["order"] })}
        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0", outline: "none" }}
      >
        {SEARCH_ORDER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.limit || DEFAULT_SEARCH_FILTERS.limit}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilters({ limit: Number(e.target.value) })}
        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0", outline: "none" }}
      >
        {SEARCH_LIMIT_OPTIONS.map((n) => (
          <option key={n} value={n}>Limit: {n}</option>
        ))}
      </select>

      <select
        value={filters.fields || DEFAULT_SEARCH_FILTERS.fields}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilters({ fields: e.target.value })}
        style={{ padding: "8px", borderRadius: "6px", border: "1px solid #E2E8F0", outline: "none" }}
      >
        {SEARCH_FIELDS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Flex>
  );
}

import type { SearchFilters } from '../model/types';

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  limit: 20,
  order: 'rank',
  fields: 'title,content',
};

export const SEARCH_ORDER_OPTIONS: { value: NonNullable<SearchFilters['order']>; label: string }[] =
  [
    { value: 'rank', label: 'Relevance ↓' },
    { value: '-rank', label: 'Relevance ↑' },
    { value: 'updatedAt', label: 'Last Modified ↑' },
    { value: '-updatedAt', label: 'Last Modified ↓' },
    { value: 'createdAt', label: 'Date Created ↑' },
    { value: '-createdAt', label: 'Date Created ↓' },
    { value: 'title', label: 'Title Z-A' },
    { value: '-title', label: 'Title A-Z' },
  ];

export const SEARCH_LIMIT_OPTIONS = [10, 20, 30, 40, 50];

export const SEARCH_FIELDS_OPTIONS = [
  { value: 'title', label: 'Title only' },
  { value: 'title,content', label: 'Title & Content' },
  { value: 'title,updatedAt', label: 'Title & Date' },
  { value: 'title,content,updatedAt', label: 'Everything' },
];

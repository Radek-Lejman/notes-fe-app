import type { ValueOf } from '@shared/lib/utils/types';

/** RAG indexing progress shown after an import. */
export const INDEXING_STATUS = {
  loading: 'loading',
  /** RAG is off on the server: nothing to show. */
  disabled: 'disabled',
  indexing: 'indexing',
  done: 'done',
  /** No progress for a while (embedding provider down). */
  stalled: 'stalled',
} as const;
export type IndexingStatus = ValueOf<typeof INDEXING_STATUS>;

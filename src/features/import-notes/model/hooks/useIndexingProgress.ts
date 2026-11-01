import { useState } from 'react';
import { useAiSettings, type AiSettings } from '@entities/ai-chat';
import {
  INDEXING_POLL_MS,
  INDEXING_STALL_MS,
  INDEXING_STALLED_POLL_MS,
} from '../../config/indexingPolling';
import { INDEXING_STATUS, type IndexingStatus } from '../indexingStatus';

type RagStats = NonNullable<AiSettings['rag']['stats']>;

const statsOf = (settings: AiSettings | undefined): RagStats | null =>
  settings?.rag.enabled ? settings.rag.stats : null;

const isIndexed = (stats: RagStats) => stats.indexedNotes >= stats.totalNotes;

const indexingStatus = (settings: AiSettings | undefined, stalled: boolean): IndexingStatus => {
  if (!settings) return INDEXING_STATUS.loading;
  const stats = statsOf(settings);
  if (!stats) return INDEXING_STATUS.disabled;
  if (isIndexed(stats)) return INDEXING_STATUS.done;
  return stalled ? INDEXING_STATUS.stalled : INDEXING_STATUS.indexing;
};

/**
 * RAG progress after an import: polls the AI settings until every note is indexed or RAG turns
 * out to be off. When nothing moved for a while (provider down) it says so and polls slower, so
 * the bar picks up again once the provider is back.
 */
export const useIndexingProgress = () => {
  const [lastProgress, setLastProgress] = useState({ indexed: -1, at: 0 });
  const isStalled = (updatedAt: number) => updatedAt - lastProgress.at >= INDEXING_STALL_MS;

  const { data, dataUpdatedAt } = useAiSettings({
    refetchInterval: (query) => {
      const stats = statsOf(query.state.data);
      if (!stats || isIndexed(stats)) return false;
      return isStalled(query.state.dataUpdatedAt) ? INDEXING_STALLED_POLL_MS : INDEXING_POLL_MS;
    },
  });
  const stats = statsOf(data);

  // Remembers when the count last moved (state adjusted while rendering, no effect needed).
  if (stats && stats.indexedNotes !== lastProgress.indexed) {
    setLastProgress({ indexed: stats.indexedNotes, at: dataUpdatedAt });
  }

  return {
    status: indexingStatus(data, !!stats && isStalled(dataUpdatedAt)),
    indexedNotes: stats?.indexedNotes ?? 0,
    totalNotes: stats?.totalNotes ?? 0,
  };
};

import { Progress, Text } from '@chakra-ui/react';
import { useIndexingProgress } from '../model/hooks/useIndexingProgress';
import { INDEXING_STATUS } from '../model/indexingStatus';

/** "Indexing for AI: 340 / 1000" while the background indexer embeds the imported notes. */
export const IndexingProgress = () => {
  const { status, indexedNotes, totalNotes } = useIndexingProgress();

  if (status === INDEXING_STATUS.loading || status === INDEXING_STATUS.disabled) return null;
  if (status === INDEXING_STATUS.done) {
    return <Text fontSize="sm">All notes are indexed for the AI chat.</Text>;
  }

  return (
    <Progress.Root value={indexedNotes} max={Math.max(totalNotes, 1)} size="sm">
      <Progress.Label fontSize="sm" mb={1}>
        Indexing for AI: {indexedNotes} / {totalNotes}
      </Progress.Label>
      <Progress.Track>
        <Progress.Range />
      </Progress.Track>
      {status === INDEXING_STATUS.stalled && (
        <Text fontSize="sm" color="fg.muted" mt={1}>
          Indexing has paused (is the embedding provider running?). It continues on its own when the
          provider is back.
        </Text>
      )}
    </Progress.Root>
  );
};

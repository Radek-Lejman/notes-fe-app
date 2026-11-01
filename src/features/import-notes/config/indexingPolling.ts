/** RAG progress polling: the BE throttles per IP and handler (40 requests a minute). */
export const INDEXING_POLL_MS = 5000;
/** No progress for this long counts as paused (provider down)… */
export const INDEXING_STALL_MS = 30_000;
/** …and is then checked this rarely until it moves again (the indexer retries every 30 s). */
export const INDEXING_STALLED_POLL_MS = 30_000;

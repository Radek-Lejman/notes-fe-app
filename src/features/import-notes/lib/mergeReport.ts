import type { ImportResult } from '@entities/notes';
import type { CollectedImport, ImportReport } from '../model/report.types';

/** The server report plus what the browser skipped and noticed while reading the selection. */
export const mergeReport = (
  selection: CollectedImport,
  result: ImportResult | undefined,
): ImportReport => ({
  dryRun: result?.dryRun ?? true,
  created: result?.created ?? 0,
  skipped: [...selection.skipped, ...(result?.skipped ?? [])],
  warnings: [...selection.warnings, ...(result?.warnings ?? [])],
});

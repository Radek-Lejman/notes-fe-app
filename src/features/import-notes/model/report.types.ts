import type { ImportFile, ImportSkipReason, ImportWarningKind } from '@entities/notes';
import type { ValueOf } from '@shared/lib/utils/types';

/** Skipped in the browser before upload; the BE never sees these files. */
export const CLIENT_SKIP_REASON = {
  tooLarge: 'too-large',
} as const;

/** Noticed in the browser while reading the selection. */
export const CLIENT_WARNING_KIND = {
  /** A zip entry name in an unknown code page (Windows CP437): Polish letters may be wrong. */
  garbledName: 'garbled-name',
} as const;

export type SkipReason = ImportSkipReason | ValueOf<typeof CLIENT_SKIP_REASON>;
export type WarningKind = ImportWarningKind | ValueOf<typeof CLIENT_WARNING_KIND>;

export interface SkippedFile {
  path: string;
  reason: SkipReason;
}

export interface ImportWarning {
  path: string;
  kind: WarningKind;
  detail: string;
}

/** What was read from the picked folder, files or zip, ready to send. */
export interface CollectedImport {
  files: ImportFile[];
  /** Default title of the import root: the picked folder or zip; empty = the BE default. */
  name: string;
  skipped: SkippedFile[];
  warnings: ImportWarning[];
}

/** The BE report with what the browser skipped and noticed added. */
export interface ImportReport {
  dryRun: boolean;
  /** Notes created (or that would be), the root included. */
  created: number;
  skipped: SkippedFile[];
  warnings: ImportWarning[];
}

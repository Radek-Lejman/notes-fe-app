import type { ValueOf } from '@shared/lib/utils/types';

/*
 * POST /notes/import contract.
 * KEEP IN SYNC with notes-app-be/src/modules/notes/dto/importNotes.dto.ts and import/importPlan.types.ts.
 */
export const IMPORT_MODE = {
  files: 'files',
  /** One file, one note per top-level `# H1`. */
  splitH1: 'split-h1',
} as const;
export type ImportMode = ValueOf<typeof IMPORT_MODE>;

export const IMPORT_SKIP_REASON = {
  notMarkdown: 'not-markdown',
  binary: 'binary',
  empty: 'empty',
  duplicatePath: 'duplicate-path',
  invalidPath: 'invalid-path',
  hidden: 'hidden',
} as const;
export type ImportSkipReason = ValueOf<typeof IMPORT_SKIP_REASON>;

export const IMPORT_WARNING_KIND = {
  unresolvedLink: 'unresolved-link',
  ambiguousLink: 'ambiguous-link',
  unsafeLink: 'unsafe-link',
  attachmentSkipped: 'attachment-skipped',
  lossyContent: 'lossy-content',
  titleFallback: 'title-fallback',
  titleTruncated: 'title-truncated',
} as const;
export type ImportWarningKind = ValueOf<typeof IMPORT_WARNING_KIND>;

export interface ImportFile {
  /** Relative path, e.g. "Projects/Docker.md"; folders become parent notes. */
  path: string;
  content: string;
}

export interface ImportNotesDto {
  files: ImportFile[];
  /** true: only report what would be created. */
  dryRun: boolean;
  /** Title of the import root note; the BE defaults to "Import YYYY-MM-DD". */
  name?: string;
  targetParentId?: string;
  mode?: ImportMode;
}

export interface ImportResult {
  dryRun: boolean;
  /** The created root note; null for a dry run. */
  rootNoteId: string | null;
  /** Notes created (or that would be), the root included. */
  created: number;
  skipped: { path: string; reason: ImportSkipReason }[];
  warnings: { path: string; kind: ImportWarningKind; detail: string }[];
}

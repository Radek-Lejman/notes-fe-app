import type { ValueOf } from '@shared/lib/utils/types';

/** Steps of the import dialog. */
export const IMPORT_STEP = {
  pick: 'pick',
  reading: 'reading',
  preview: 'preview',
  importing: 'importing',
  done: 'done',
} as const;
export type ImportStep = ValueOf<typeof IMPORT_STEP>;

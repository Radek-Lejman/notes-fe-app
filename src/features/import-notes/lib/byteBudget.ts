import { MAX_IMPORT_TOTAL_BYTES } from '../config/importLimits';
import { ImportSelectionError } from './importSelectionError';

const MB = 1024 * 1024;

/** Takes bytes from the budget; throws once the import grows over it. */
export type TakeBytes = (bytes: number) => void;

/** Counts the imported bytes while reading, so a huge selection stops before it is in memory. */
export const createByteBudget = (limit = MAX_IMPORT_TOTAL_BYTES): TakeBytes => {
  let used = 0;
  return (bytes) => {
    used += bytes;
    if (used > limit) {
      throw new ImportSelectionError(
        `The markdown files are larger than ${Math.round(limit / MB)} MB. Import a smaller folder.`,
      );
    }
  };
};

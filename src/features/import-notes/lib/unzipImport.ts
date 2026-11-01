import { unzipSync } from 'fflate';
import { IMPORT_SKIP_REASON } from '@entities/notes';
import { MAX_NESTED_ZIP_BYTES } from '../config/importLimits';
import { CLIENT_WARNING_KIND, type ImportWarning, type SkippedFile } from '../model/report.types';
import { ImportSelectionError } from './importSelectionError';
import type { TakeBytes } from './byteBudget';
import { baseName, dirName, isHiddenPath, isImportablePath, isZipPath } from './importPaths';
import { repairZipName } from './zipEntryName';

export interface ZipEntry {
  path: string;
  bytes: Uint8Array;
}

export interface UnzippedImport {
  entries: ZipEntry[];
  skipped: SkippedFile[];
  warnings: ImportWarning[];
}

const prefixed = (prefix: string, path: string) => (prefix ? `${prefix}/${path}` : path);

/**
 * Unpacks only the markdown entries of a zip (attachments are listed as skipped, never inflated)
 * and zips inside it one level deep (Notion's `Export-…-Part-1.zip`). Sizes count against the
 * budget before inflating, from the declared size, which also caps what fflate allocates.
 */
export const unzipImport = (
  data: Uint8Array,
  zipName: string,
  takeBytes: TakeBytes,
  nested = false,
): UnzippedImport => {
  const result: UnzippedImport = { entries: [], skipped: [], warnings: [] };
  // fflate keys the result by the raw entry name; ours may be repaired.
  const repairedNames = new Map<string, string>();

  const accept = (file: { name: string; originalSize: number }): boolean => {
    if (file.name.endsWith('/')) return false;
    const { name, garbled } = repairZipName(file.name);
    if (garbled) {
      result.warnings.push({ path: name, kind: CLIENT_WARNING_KIND.garbledName, detail: '' });
    }
    if (isHiddenPath(name)) {
      result.skipped.push({ path: name, reason: IMPORT_SKIP_REASON.hidden });
      return false;
    }
    const innerZip = !nested && isZipPath(name) && file.originalSize <= MAX_NESTED_ZIP_BYTES;
    if (!innerZip && !isImportablePath(name)) {
      result.skipped.push({ path: name, reason: IMPORT_SKIP_REASON.notMarkdown });
      return false;
    }
    if (!innerZip) takeBytes(file.originalSize);
    repairedNames.set(file.name, name);
    return true;
  };

  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data, { filter: accept });
  } catch (error) {
    if (error instanceof ImportSelectionError) throw error;
    throw new ImportSelectionError(`"${zipName}" is not a zip file that can be read.`);
  }

  for (const [rawName, bytes] of Object.entries(files)) {
    const path = repairedNames.get(rawName) ?? rawName;
    if (!isZipPath(path)) {
      result.entries.push({ path, bytes });
      continue;
    }
    const inner = unzipImport(bytes, baseName(path), takeBytes, true);
    const folder = dirName(path);
    result.entries.push(...inner.entries.map((e) => ({ ...e, path: prefixed(folder, e.path) })));
    result.skipped.push(...inner.skipped.map((s) => ({ ...s, path: prefixed(folder, s.path) })));
    result.warnings.push(...inner.warnings);
  }
  return result;
};

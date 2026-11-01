import { IMPORT_SKIP_REASON, type ImportFile } from '@entities/notes';
import { MAX_IMPORT_FILES, MAX_NOTE_CONTENT_LENGTH } from '../config/importLimits';
import { CLIENT_SKIP_REASON, type CollectedImport, type SkippedFile } from '../model/report.types';
import { ImportSelectionError } from './importSelectionError';
import { createByteBudget, type TakeBytes } from './byteBudget';
import { isHiddenPath, isImportablePath, isZipPath, stripCommonRoot } from './importPaths';
import { unzipImport, type UnzippedImport } from './unzipImport';

/** A file's path from a picked folder ("Vault/a.md"); just the name when picked without one. */
const pathOf = (file: File) => file.webkitRelativePath || file.name;

const readBytes = async (file: File) => new Uint8Array(await file.arrayBuffer());

/** One picked folder, set of files or zip, with paths relative to its top folder. */
interface Source extends UnzippedImport {
  name: string | null;
}

/** Loose files or a picked folder: markdown is read, the rest listed as skipped. */
const readFiles = async (files: File[], takeBytes: TakeBytes): Promise<Source> => {
  const { root, paths } = stripCommonRoot(files.map(pathOf));
  const source: Source = { name: root, entries: [], skipped: [], warnings: [] };
  for (const [index, file] of files.entries()) {
    const path = paths[index];
    if (isHiddenPath(path)) {
      source.skipped.push({ path, reason: IMPORT_SKIP_REASON.hidden });
    } else if (!isImportablePath(path)) {
      source.skipped.push({ path, reason: IMPORT_SKIP_REASON.notMarkdown });
    } else {
      takeBytes(file.size);
      source.entries.push({ path, bytes: await readBytes(file) });
    }
  }
  return source;
};

const readZip = async (file: File, takeBytes: TakeBytes): Promise<Source> => {
  const zip = unzipImport(await readBytes(file), file.name, takeBytes);
  const paths = [...zip.entries, ...zip.skipped].map((item) => item.path);
  // `__MACOSX/` sits next to the top folder in zips made on macOS.
  const { root } = stripCommonRoot(paths.filter((path) => !isHiddenPath(path)));
  const strip = <Item extends { path: string }>(item: Item): Item =>
    root && item.path.startsWith(`${root}/`)
      ? { ...item, path: item.path.slice(root.length + 1) }
      : item;
  return {
    name: root ?? file.name.replace(/\.zip$/i, ''),
    entries: zip.entries.map(strip),
    skipped: zip.skipped.map(strip),
    warnings: zip.warnings,
  };
};

/**
 * Reads the picked folder, files or zips into the import payload. A common top folder becomes the
 * default name; attachments and hidden files are left out (and reported) instead of uploaded.
 */
export const collectImport = async (
  picked: File[],
  takeBytes = createByteBudget(),
): Promise<CollectedImport> => {
  const zips = picked.filter((file) => isZipPath(pathOf(file)));
  const others = picked.filter((file) => !isZipPath(pathOf(file)));

  const sources: Source[] = [];
  if (others.length > 0) sources.push(await readFiles(others, takeBytes));
  for (const zip of zips) sources.push(await readZip(zip, takeBytes));

  const decoder = new TextDecoder();
  const files: ImportFile[] = [];
  const skipped: SkippedFile[] = sources.flatMap((source) => source.skipped);
  for (const { path, bytes } of sources.flatMap((source) => source.entries)) {
    const content = decoder.decode(bytes);
    if (content.length > MAX_NOTE_CONTENT_LENGTH) {
      skipped.push({ path, reason: CLIENT_SKIP_REASON.tooLarge });
    } else {
      files.push({ path, content });
    }
  }

  if (files.length > MAX_IMPORT_FILES) {
    throw new ImportSelectionError(
      `${files.length} markdown files were found; one import takes up to ${MAX_IMPORT_FILES}. Import a smaller folder.`,
    );
  }

  return {
    files,
    name: sources.find((source) => source.name)?.name ?? '',
    skipped,
    warnings: sources.flatMap((source) => source.warnings),
  };
};

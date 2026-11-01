/** Files the BE imports (`isImportablePath`); everything else is an attachment. */
const IMPORTABLE_EXTENSIONS = ['md', 'markdown', 'txt'];
const IMPORTABLE = new RegExp(`\\.(?:${IMPORTABLE_EXTENSIONS.join('|')})$`, 'i');
const ZIP = /\.zip$/i;

/** The `accept` list of the file picker: importable files and zips. */
export const PICKABLE_FILE_TYPES = [...IMPORTABLE_EXTENSIONS, 'zip']
  .map((ext) => `.${ext}`)
  .join(',');

export const isImportablePath = (path: string) => IMPORTABLE.test(path);
export const isZipPath = (path: string) => ZIP.test(path);

/** `.obsidian/`, `.git/`, `.DS_Store`, and the `__MACOSX/` folder of zips made on macOS. */
export const isHiddenPath = (path: string) =>
  path.split('/').some((segment) => segment.startsWith('.') || segment === '__MACOSX');

export const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1);

export const dirName = (path: string) => {
  const slash = path.lastIndexOf('/');
  return slash < 0 ? '' : path.slice(0, slash);
};

/**
 * The folder every path is in (`MyVault/…` in a zip, the picked folder), stripped from the
 * paths and returned as the default name of the import. Null when the paths have no such folder.
 */
export const stripCommonRoot = (paths: string[]): { root: string | null; paths: string[] } => {
  const first = paths[0]?.split('/')[0];
  const shared =
    first !== undefined &&
    paths.every((path) => path.startsWith(`${first}/`) && path.length > first.length + 1);
  if (!shared) return { root: null, paths };
  return { root: first, paths: paths.map((path) => path.slice(first.length + 1)) };
};

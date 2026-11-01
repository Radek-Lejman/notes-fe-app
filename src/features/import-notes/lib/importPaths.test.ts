import { describe, expect, it } from 'vitest';
import {
  baseName,
  dirName,
  isHiddenPath,
  isImportablePath,
  PICKABLE_FILE_TYPES,
  stripCommonRoot,
} from './importPaths';
describe('importPaths', () => {
  it('lets the picker accept every importable file and zips', () => {
    expect(PICKABLE_FILE_TYPES).toBe('.md,.markdown,.txt,.zip');
  });

  it.each([
    ['a.md', true],
    ['Notes/A.MARKDOWN', true],
    ['todo.txt', true],
    ['img.png', false],
    ['md', false],
  ])('importable %s → %s', (path, expected) => {
    expect(isImportablePath(path)).toBe(expected);
  });

  it.each([
    ['.obsidian/workspace.md', true],
    ['Notes/.DS_Store', true],
    ['__MACOSX/Notes/._a.md', true],
    ['Notes/a.md', false],
    ['Notes/a.b.md', false],
  ])('hidden %s → %s', (path, expected) => {
    expect(isHiddenPath(path)).toBe(expected);
  });

  it.each([
    ['a/b/c.md', 'a/b', 'c.md'],
    ['c.md', '', 'c.md'],
  ])('%s is %j + %j', (path, dir, base) => {
    expect(dirName(path)).toBe(dir);
    expect(baseName(path)).toBe(base);
  });

  describe('stripCommonRoot', () => {
    it('strips the folder every path is in', () => {
      expect(stripCommonRoot(['Vault/a.md', 'Vault/Projects/b.md'])).toEqual({
        root: 'Vault',
        paths: ['a.md', 'Projects/b.md'],
      });
    });

    it.each([
      [['a.md', 'Vault/b.md']],
      [['Vault/a.md', 'Other/b.md']],
      [['Vault/a.md', 'Vaults/b.md']],
      [[]],
    ])('keeps %j as it is', (paths) => {
      expect(stripCommonRoot(paths)).toEqual({ root: null, paths });
    });
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { strToU8, zipSync, type Zippable } from 'fflate';
import { ImportSelectionError } from './importSelectionError';
import { createByteBudget } from './byteBudget';
import { collectImport } from './collectImport';

/** A browser file; a path with folders is what a folder pick gives (`webkitRelativePath`). */
const file = (path: string, content: string | Uint8Array<ArrayBuffer>) => {
  const picked = new File([content], path.slice(path.lastIndexOf('/') + 1));
  if (path.includes('/')) Object.defineProperty(picked, 'webkitRelativePath', { value: path });
  return picked;
};

const zip = (name: string, files: Zippable) => file(name, zipSync(files));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('collectImport', () => {
  it('reads a picked folder without its own name, which becomes the default name', async () => {
    const result = await collectImport([
      file('Vault/Inbox.md', '# Inbox'),
      file('Vault/Projects/Docker.md', 'docker'),
      file('Vault/Projects/diagram.png', 'png'),
      file('Vault/.obsidian/app.md', '{}'),
    ]);

    expect(result).toEqual({
      name: 'Vault',
      files: [
        { path: 'Inbox.md', content: '# Inbox' },
        { path: 'Projects/Docker.md', content: 'docker' },
      ],
      skipped: [
        { path: 'Projects/diagram.png', reason: 'not-markdown' },
        { path: '.obsidian/app.md', reason: 'hidden' },
      ],
      warnings: [],
    });
  });

  it('reads loose files by their names, with no default name', async () => {
    const result = await collectImport([file('a.md', 'a'), file('b.txt', 'b'), file('c.pdf', 'c')]);

    expect(result.name).toBe('');
    expect(result.files.map((picked) => picked.path)).toEqual(['a.md', 'b.txt']);
    expect(result.skipped).toEqual([{ path: 'c.pdf', reason: 'not-markdown' }]);
  });

  it('unpacks markdown from a zip and strips its top folder', async () => {
    const result = await collectImport([
      zip('export.zip', {
        'MyVault/a.md': strToU8('# A'),
        'MyVault/sub/b.md': strToU8('b'),
        'MyVault/sub/photo.jpg': strToU8('jpg'),
        '__MACOSX/MyVault/._a.md': strToU8('x'),
      }),
    ]);

    expect(result.name).toBe('MyVault');
    expect(result.files).toEqual([
      { path: 'a.md', content: '# A' },
      { path: 'sub/b.md', content: 'b' },
    ]);
    expect(result.skipped).toEqual(
      expect.arrayContaining([
        { path: 'sub/photo.jpg', reason: 'not-markdown' },
        { path: '__MACOSX/MyVault/._a.md', reason: 'hidden' },
      ]),
    );
  });

  it('names a zip without a top folder after the file', async () => {
    const result = await collectImport([zip('Notion.zip', { 'a.md': strToU8('a') })]);
    expect(result.name).toBe('Notion');
  });

  it('unpacks zips inside the zip one level deep, in their folder', async () => {
    const inner = zipSync({ 'Page.md': strToU8('page'), 'deeper.zip': zipSync({}) });
    const result = await collectImport([
      zip('Export.zip', { 'Part-1.zip': inner, 'parts/Part-2.zip': inner }),
    ]);

    expect(result.files.map((picked) => picked.path).sort()).toEqual(['Page.md', 'parts/Page.md']);
    expect(result.skipped).toEqual(
      expect.arrayContaining([{ path: 'deeper.zip', reason: 'not-markdown' }]),
    );
  });

  it('skips a note too long to save', async () => {
    const result = await collectImport([file('big.md', 'x'.repeat(1_000_001)), file('ok.md', 'x')]);

    expect(result.files.map((picked) => picked.path)).toEqual(['ok.md']);
    expect(result.skipped).toEqual([{ path: 'big.md', reason: 'too-large' }]);
  });

  it('stops when the markdown is over the size limit, before reading it all', async () => {
    const read = vi.spyOn(Blob.prototype, 'arrayBuffer');

    await expect(
      collectImport(
        [file('a.md', 'xxxx'), file('b.md', 'xxxx'), file('c.md', 'xxxx')],
        createByteBudget(6),
      ),
    ).rejects.toBeInstanceOf(ImportSelectionError);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('counts the declared size of zip entries against the limit', async () => {
    await expect(
      collectImport([zip('a.zip', { 'a.md': strToU8('x'.repeat(100)) })], createByteBudget(50)),
    ).rejects.toThrow('larger than');
  });

  it('refuses more files than one import takes', async () => {
    const files = Array.from({ length: 2001 }, (_, i) => file(`n${i}.md`, 'x'));
    await expect(collectImport(files)).rejects.toThrow('2001 markdown files');
  });

  it('reports a file that is not a zip', async () => {
    await expect(collectImport([file('broken.zip', 'not a zip')])).rejects.toThrow(
      '"broken.zip" is not a zip file',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { mergeReport } from './mergeReport';

const selection = {
  files: [{ path: 'a.md', content: 'a' }],
  name: 'Vault',
  skipped: [{ path: 'big.md', reason: 'too-large' as const }],
  warnings: [{ path: 'ż.md', kind: 'garbled-name' as const, detail: '' }],
};

describe('mergeReport', () => {
  it('puts what the browser found before the server report', () => {
    expect(
      mergeReport(selection, {
        dryRun: false,
        rootNoteId: 'root',
        created: 2,
        skipped: [{ path: 'e.md', reason: 'empty' }],
        warnings: [{ path: 'a.md', kind: 'unresolved-link', detail: 'X' }],
      }),
    ).toEqual({
      dryRun: false,
      created: 2,
      skipped: [...selection.skipped, { path: 'e.md', reason: 'empty' }],
      warnings: [...selection.warnings, { path: 'a.md', kind: 'unresolved-link', detail: 'X' }],
    });
  });

  it('reports only the selection before the server answers', () => {
    expect(mergeReport(selection, undefined)).toEqual({
      dryRun: true,
      created: 0,
      skipped: selection.skipped,
      warnings: selection.warnings,
    });
  });
});

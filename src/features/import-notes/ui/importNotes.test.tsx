import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesApi, type ImportNotesDto, type ImportResult } from '@entities/notes';
import { AiChatApi, type AiSettings } from '@entities/ai-chat';
import { ApiError } from '@shared/api';
import { LocationProbe, renderWithProviders } from '@shared/lib/test/render';
import { ImportNotesButton } from './ImportNotesButton';

const report = (dryRun: boolean, overrides: Partial<ImportResult> = {}): ImportResult => ({
  dryRun,
  rootNoteId: dryRun ? null : 'root-1',
  created: 3,
  skipped: [],
  warnings: [{ path: 'a.md', kind: 'lossy-content', detail: 'table' }],
  ...overrides,
});

const settings = (stats: AiSettings['rag']['stats']): AiSettings => ({
  provider: 'ollama',
  model: 'llama',
  requiresAccount: false,
  credential: null,
  serverLoginAllowed: false,
  ready: true,
  rag: { enabled: stats !== null, embeddingModel: 'nomic', stats },
});

const pickFiles = (files: File[]) =>
  fireEvent.change(screen.getByTestId('import-files-input'), { target: { files } });

const openDialog = async () => {
  renderWithProviders(
    <>
      <ImportNotesButton />
      <LocationProbe />
    </>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Import notes' }));
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ImportNotesButton', () => {
  it('previews the picked files, imports them and opens the imported notes', async () => {
    const importNotes = vi
      .spyOn(NotesApi, 'importNotes')
      .mockImplementation((payload: ImportNotesDto) => Promise.resolve(report(payload.dryRun)));
    vi.spyOn(AiChatApi, 'getSettings').mockResolvedValue(
      settings({ indexedNotes: 1, totalNotes: 3, chunks: 1 }),
    );
    await openDialog();

    pickFiles([new File(['# A'], 'a.md'), new File(['b'], 'b.md'), new File(['p'], 'p.png')]);

    expect(await screen.findByText(/Notes to create/)).toHaveTextContent('Notes to create: 3');
    expect(screen.getByText(/Tables, images, HTML or footnotes/)).toHaveTextContent(': 1');
    expect(screen.getByText(/Not markdown/)).toHaveTextContent(': 1');
    expect(importNotes.mock.lastCall?.[0]).toEqual({
      files: [
        { path: 'a.md', content: '# A' },
        { path: 'b.md', content: 'b' },
      ],
      dryRun: true,
      name: undefined,
      mode: 'files',
    });

    await userEvent.type(screen.getByLabelText('Name of the import note'), 'Vault');
    await userEvent.click(screen.getByRole('button', { name: 'Import' }));

    expect(await screen.findByText(/notes are imported/)).toBeInTheDocument();
    expect(importNotes.mock.lastCall?.[0]).toMatchObject({ dryRun: false, name: 'Vault' });
    // The navigation runs in the mutate callback, after the success state renders.
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/note/root-1'));
    expect(await screen.findByText('Indexing for AI: 1 / 3')).toBeInTheDocument();
  });

  it('splits a single file by H1 on request, checking it again', async () => {
    const importNotes = vi
      .spyOn(NotesApi, 'importNotes')
      .mockImplementation((payload: ImportNotesDto) => Promise.resolve(report(payload.dryRun)));
    await openDialog();

    pickFiles([new File(['# A\n# B'], 'all.md')]);
    await userEvent.click(await screen.findByText('One note per top-level heading (# H1)'));

    await waitFor(() =>
      expect(importNotes.mock.lastCall?.[0]).toMatchObject({ dryRun: true, mode: 'split-h1' }),
    );
  });

  it('does not offer to import a selection with nothing to create', async () => {
    vi.spyOn(NotesApi, 'importNotes').mockResolvedValue(report(true, { created: 1, warnings: [] }));
    await openDialog();

    pickFiles([new File([''], 'empty.md')]);

    expect(await screen.findByText(/Notes to create/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  it('says when no markdown was found, without asking the server', async () => {
    const importNotes = vi.spyOn(NotesApi, 'importNotes');
    await openDialog();

    pickFiles([new File(['p'], 'photo.png')]);

    expect(await screen.findByText('No markdown or text files were found.')).toBeInTheDocument();
    expect(importNotes).not.toHaveBeenCalled();
  });

  it('shows why the server refused the import', async () => {
    vi.spyOn(NotesApi, 'importNotes').mockRejectedValue(
      new ApiError(400, 'Note "a.md" is too long after rewriting its links'),
    );
    await openDialog();

    pickFiles([new File(['# A'], 'a.md')]);

    expect(await screen.findByText(/too long after rewriting/)).toBeInTheDocument();
  });
});

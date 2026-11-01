import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { IMPORT_MODE, useImportNotes, type ImportFile, type ImportNotesDto } from '@entities/notes';
import { collectImport } from '../../lib/collectImport';
import { mergeReport } from '../../lib/mergeReport';
import { IMPORT_STEP, type ImportStep } from '../importStep';

interface ImportOptions {
  name: string;
  splitByH1: boolean;
}

const toPayload = (
  files: ImportFile[],
  { name, splitByH1 }: ImportOptions,
  dryRun: boolean,
): ImportNotesDto => ({
  files,
  dryRun,
  name: name.trim() || undefined,
  mode: splitByH1 ? IMPORT_MODE.splitH1 : IMPORT_MODE.files,
});

/**
 * Pick → read in the browser → dry run (the report) → import. Changing the H1 split runs the dry
 * run again; the name only titles the root note, so it is sent with the import as it is.
 */
export const useNoteImport = ({ onImported }: { onImported: (rootNoteId: string) => void }) => {
  const [name, setName] = useState('');
  const [splitByH1, setSplitByH1] = useState(false);
  const collect = useMutation({ mutationFn: (files: File[]) => collectImport(files) });
  const preview = useImportNotes();
  const importer = useImportNotes();
  const selection = collect.data;

  const runPreview = (files: ImportFile[], options: ImportOptions) => {
    if (files.length > 0) preview.mutate(toPayload(files, options, true));
  };

  const reset = () => {
    collect.reset();
    preview.reset();
    importer.reset();
    setName('');
    setSplitByH1(false);
  };

  const pick = (files: File[]) => {
    if (files.length === 0) return;
    reset();
    collect.mutate(files, {
      onSuccess: (collected) => {
        setName(collected.name);
        runPreview(collected.files, { name: collected.name, splitByH1: false });
      },
    });
  };

  const changeSplitByH1 = (value: boolean) => {
    setSplitByH1(value);
    if (selection) runPreview(selection.files, { name, splitByH1: value });
  };

  const startImport = () => {
    if (!selection) return;
    importer.mutate(toPayload(selection.files, { name, splitByH1 }, false), {
      onSuccess: ({ rootNoteId }) => {
        if (rootNoteId) onImported(rootNoteId);
      },
    });
  };

  const currentStep = (): ImportStep => {
    if (importer.isSuccess) return IMPORT_STEP.done;
    if (importer.isPending) return IMPORT_STEP.importing;
    if (collect.isPending) return IMPORT_STEP.reading;
    return selection ? IMPORT_STEP.preview : IMPORT_STEP.pick;
  };

  return {
    step: currentStep(),
    selection,
    report: selection ? mergeReport(selection, importer.data ?? preview.data) : null,
    name,
    setName,
    splitByH1,
    canSplitByH1: selection?.files.length === 1,
    changeSplitByH1,
    isPreviewing: preview.isPending,
    // A real import needs more than the root note.
    canImport: !!preview.data && preview.data.created > 1 && !preview.isPending,
    error: collect.error ?? importer.error ?? preview.error,
    pick,
    startImport,
    reset,
  };
};

export type NoteImportFlow = ReturnType<typeof useNoteImport>;

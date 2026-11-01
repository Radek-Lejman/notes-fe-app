import { Checkbox, Field, Flex, Input, Spinner, Text } from '@chakra-ui/react';
import { AppAlert } from '@shared/ui/AppAlert';
import { MAX_IMPORT_NAME_LENGTH } from '../config/importLimits';
import type { NoteImportFlow } from '../model/hooks/useNoteImport';
import { ImportReportView } from './ImportReportView';

/** The name, the H1 split and the dry run report of the picked files. */
export const ImportPreviewStep = ({ flow }: { flow: NoteImportFlow }) => (
  <>
    <Field.Root>
      <Field.Label>Name of the import note</Field.Label>
      <Input
        value={flow.name}
        onChange={(e) => flow.setName(e.target.value)}
        placeholder="Import with today's date"
        maxLength={MAX_IMPORT_NAME_LENGTH}
      />
    </Field.Root>
    {flow.canSplitByH1 && (
      <Checkbox.Root
        checked={flow.splitByH1}
        onCheckedChange={(e) => flow.changeSplitByH1(e.checked === true)}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>One note per top-level heading (# H1)</Checkbox.Label>
      </Checkbox.Root>
    )}
    {flow.selection?.files.length === 0 && (
      <AppAlert status="warning">No markdown or text files were found.</AppAlert>
    )}
    {flow.isPreviewing ? (
      <Flex gap={2} align="center">
        <Spinner size="sm" /> <Text fontSize="sm">Checking the files…</Text>
      </Flex>
    ) : (
      flow.report && <ImportReportView report={flow.report} />
    )}
  </>
);

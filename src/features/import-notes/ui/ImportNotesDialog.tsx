import { useNavigate } from 'react-router-dom';
import { Button, Dialog, Flex, Spinner, Stack, Text } from '@chakra-ui/react';
import { AppAlert } from '@shared/ui/AppAlert';
import { useNoteImport } from '../model/hooks/useNoteImport';
import { IMPORT_STEP } from '../model/importStep';
import { ImportDoneStep } from './ImportDoneStep';
import { ImportFilePicker } from './ImportFilePicker';
import { ImportPreviewStep } from './ImportPreviewStep';

export interface ImportNotesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportNotesDialog = ({ isOpen, onClose }: ImportNotesDialogProps) => {
  const navigate = useNavigate();
  const flow = useNoteImport({ onImported: (rootNoteId) => void navigate(`/note/${rootNoteId}`) });
  const isImporting = flow.step === IMPORT_STEP.importing;
  const showsPreview = flow.step === IMPORT_STEP.preview || isImporting;

  const close = () => {
    flow.reset();
    onClose();
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => {
        // A running import finishes in the dialog, which then opens the imported notes.
        if (!e.open && !isImporting) close();
      }}
    >
      <Dialog.Backdrop bg="blackAlpha.300" backdropFilter="blur(4px)" zIndex={1300} />
      <Dialog.Positioner zIndex={1400}>
        <Dialog.Content
          maxW="560px"
          mt="10vh"
          bg="white"
          borderRadius="md"
          p={5}
          boxShadow="2xl"
          _dark={{ bg: 'gray.800' }}
        >
          <Dialog.Title fontWeight="bold" mb={4}>
            Import notes
          </Dialog.Title>

          <Stack gap={4} maxH="65vh" overflowY="auto">
            {flow.step === IMPORT_STEP.pick && (
              <>
                <Text fontSize="sm">
                  Import markdown notes from another app: an Obsidian vault folder, a Notion export
                  (.zip), or any .md / .txt files. Folders become parent notes and links between the
                  files keep working.
                </Text>
                <ImportFilePicker onPick={flow.pick} />
              </>
            )}
            {flow.step === IMPORT_STEP.reading && (
              <Flex gap={2} align="center">
                <Spinner size="sm" /> <Text fontSize="sm">Reading files…</Text>
              </Flex>
            )}
            {showsPreview && <ImportPreviewStep flow={flow} />}
            {flow.step === IMPORT_STEP.done && flow.report && (
              <ImportDoneStep report={flow.report} />
            )}
            {flow.error && <AppAlert status="error">{flow.error.message}</AppAlert>}
          </Stack>

          <Flex justify="space-between" gap={3} mt={5} wrap="wrap">
            {flow.step === IMPORT_STEP.preview ? <ImportFilePicker onPick={flow.pick} /> : <span />}
            <Flex gap={3}>
              {flow.step === IMPORT_STEP.done ? (
                <Button onClick={close}>Close</Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={close} disabled={isImporting}>
                    Cancel
                  </Button>
                  {showsPreview && (
                    <Button
                      colorPalette="blue"
                      onClick={flow.startImport}
                      disabled={!flow.canImport}
                      loading={isImporting}
                    >
                      Import
                    </Button>
                  )}
                </>
              )}
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

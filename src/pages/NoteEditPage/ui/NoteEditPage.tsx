import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@shared/ui/layouts/MainLayout/MainLayout';
import { Button, Flex, Spinner } from '@chakra-ui/react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary/AsyncBoundary';
import { ErrorMessage } from '@shared/ui/ErrorMessage/ErrorMessage';
import { NoteEditWidget, NoteCreateWidget } from '@widgets/NoteEditorWidget';
import { DeleteNoteAction } from '@features/manage-notes';
import { NoteChatWidget } from '@widgets/NoteChatWidget';

export const NoteEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reset } = useQueryErrorResetBoundary();

  const handleNoteCreated = (newNoteId: string) => {
    void navigate(`/note/${newNoteId}`, { replace: true });
  };

  if (!id) {
    return (
      <MainLayout title="Create Note">
        <NoteCreateWidget onNoteCreated={handleNoteCreated} />
      </MainLayout>
    );
  }

  return (
    // Keyed by id so navigating to another note clears a previous load error
    <AsyncBoundary
      key={id}
      onReset={reset}
      pendingFallback={
        <MainLayout title="Loading Note...">
          <Flex justify="center" align="center" h="100%">
            <Spinner />
          </Flex>
        </MainLayout>
      }
      rejectedFallback={({ error, resetErrorBoundary }) => (
        <MainLayout title="Edit Note">
          <ErrorMessage message={error.message} />
          <Button size="sm" variant="outline" onClick={resetErrorBoundary}>
            Try again
          </Button>
        </MainLayout>
      )}
    >
      <MainLayout
        title="Edit Note"
        headerActions={
          <>
            <NoteChatWidget key={id} noteId={id} />
            <DeleteNoteAction noteId={id} />
          </>
        }
      >
        <NoteEditWidget key={id} noteId={id} />
      </MainLayout>
    </AsyncBoundary>
  );
};

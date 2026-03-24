import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@shared/ui/layouts/MainLayout/MainLayout";
import { Flex, Spinner } from "@chakra-ui/react";
import { Suspense } from "react";
import { NoteEditWidget, NoteCreateWidget } from "@widgets/NoteEditorWidget";
import { DeleteNoteAction } from "@features/manage-notes";

export const NoteEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleNoteCreated = (newNoteId: string) => {
    navigate(`/note/${newNoteId}`, { replace: true });
  };

  if (!id) {
    return (
      <MainLayout title="Create Note">
        <NoteCreateWidget onNoteCreated={handleNoteCreated} />
      </MainLayout>
    );
  }

  return (
    <Suspense fallback={
      <MainLayout title="Loading Note...">
        <Flex justify="center" align="center" h="100%">
          <Spinner />
        </Flex>
      </MainLayout>
    }>
      <MainLayout
        title="Edit Note"
        headerActions={<DeleteNoteAction noteId={id} />}
      >
        <NoteEditWidget key={id} noteId={id} />
      </MainLayout>
    </Suspense>
  );
};

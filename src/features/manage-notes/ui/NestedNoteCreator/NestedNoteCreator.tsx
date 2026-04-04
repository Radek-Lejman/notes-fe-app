import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, Input, Text, Flex, Button } from "@chakra-ui/react";
import { useRichEditorContext } from "@shared/ui/RichEditor";
import { useNoteEditorContext } from "../../model/NoteEditorContext";

export interface NestedNoteCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onNestedNoteCreateRequest: (title: string) => Promise<{ id: string; title: string }>;
}

export const NestedNoteCreator = ({
  isOpen,
  onClose,
  onNestedNoteCreateRequest,
}: NestedNoteCreatorProps) => {
  const { editor } = useRichEditorContext();
  const { commitEditorState } = useNoteEditorContext();
  const [title, setTitle] = useState("");

  const closeDialog = () => {
    setTitle("");
    reset(); 
    onClose();
  };

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: (newTitle: string) => onNestedNoteCreateRequest(newTitle),
    onSuccess: (newPage: { id: string; title: string }) => {
      if (!editor) return;
      editor.chain().focus().insertPageReference({ noteId: newPage.id, title: newPage.title }).run();
      closeDialog();
      commitEditorState(editor.getJSON());
    }
  });

  const handleCreate = () => {
    if (!title.trim() || !editor) return;
    mutate(title);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) closeDialog(); }}>
      <Dialog.Backdrop bg="blackAlpha.300" backdropFilter="blur(4px)" zIndex={1300} />
      <Dialog.Positioner zIndex={1400}>
        <Dialog.Content maxW="400px" mt="10vh" bg="white" borderRadius="md" p={5} boxShadow="2xl" _dark={{ bg: "gray.800" }}>
          <Text fontWeight="bold" mb={4}>Create Sub-note</Text>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Page title..." 
            mb={2}
            autoFocus
          />
          {error && <Text color="red.500" fontSize="sm">{error.message}</Text>}
          <Flex justify="flex-end" gap={3} mt={4}>
            <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleCreate} loading={isPending}>Create</Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

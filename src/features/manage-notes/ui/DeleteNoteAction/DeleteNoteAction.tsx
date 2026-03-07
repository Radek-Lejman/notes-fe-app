import { IconButton } from "@chakra-ui/react";
import { FiTrash } from "react-icons/fi";

interface DeleteNoteActionProps {
  noteId: string;
}

export const DeleteNoteAction = ({ noteId }: DeleteNoteActionProps) => {
  const handleDelete = () => {
    console.log(`Deleting note with id: ${noteId}`);
  };

  return (
    <IconButton
      aria-label="Delete note"
      colorPalette="red"
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      title="Delete note"
    >
      <FiTrash />
    </IconButton>
  );
};

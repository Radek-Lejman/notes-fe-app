import { useState } from "react";
import { Dialog, Button } from "@chakra-ui/react";
import { FaSearch } from "react-icons/fa";
import { NoteSearch } from "@/features/note-search";

export function GlobalSearchWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog.Root placement="top" open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button w="full" variant="ghost" justifyContent="flex-start" color="gray.500" _hover={{ bg: "gray.100" }}>
          <FaSearch style={{ marginRight: "8px" }} /> Search...
        </Button>
      </Dialog.Trigger>
      
      <Dialog.Backdrop bg="blackAlpha.300" backdropFilter="blur(4px)" />
      
      <Dialog.Positioner>
        <Dialog.Content maxW="600px" mt="10vh" bg="white" borderRadius="xl" p={5} boxShadow="2xl">
          <NoteSearch.Root onItemSelect={() => setIsOpen(false)}>
            <NoteSearch.Input placeholder="Search notes..." />
            <NoteSearch.Filters />
            <NoteSearch.Results />
          </NoteSearch.Root>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

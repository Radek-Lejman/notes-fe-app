import { Box, VStack, Text, Flex } from "@chakra-ui/react";
import { useNoteSearchContext } from "./NoteSearchContext";
import { LoadingSpinner } from "@shared/ui/Spinner/Spinner";
import { ErrorMessage } from "@shared/ui/ErrorMessage/ErrorMessage";
import { useNavigate } from "react-router-dom";

export function NoteSearchResults() {
  const { results, isLoading, isError, error, debouncedQuery, onItemSelect } = useNoteSearchContext();
  const navigate = useNavigate();

  const handleNoteClick = (noteId: string) => {
    void navigate(`/note/${noteId}`);
    if (onItemSelect) {
      onItemSelect(noteId);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" py={4}>
        <LoadingSpinner />
        <Text ml={3} color="gray.500">Searching...</Text>
      </Flex>
    );
  }

  if (isError) {
    return (
      <ErrorMessage 
        message={`An error occurred during search: ${error instanceof Error ? error.message : "Unknown error"}`} 
      />
    );
  }

  if (!isLoading && !isError && results.length === 0 && debouncedQuery.trim().length > 0) {
    return <Text color="gray.500">No results for "{debouncedQuery}".</Text>;
  }

  if (results.length === 0) {
    return null; 
  }

  return (
    <VStack align="stretch" gap={3} w="full">
      <Text fontSize="sm" color="gray.500">Found: {results.length}</Text>
      {results.map((note) => (
        <Box
          key={note.id}
          border="1px solid"
          borderColor="gray.200"
          p={3}
          borderRadius="md"
          _hover={{ bg: "gray.50", cursor: "pointer", borderColor: "blue.300" }}
          transition="all 0.2s"
          onClick={() => handleNoteClick(note.id)}
        >
          <Text fontWeight="bold">{note.title || "(no title)"}</Text>
          {/* {note.content ? (
            <Text fontSize="sm" color="gray.600" lineClamp={3} mt={1}>
              {note.content}
            </Text>
          ) : (
             <Text fontSize="xs" color="gray.400" mt={1}>(no content)</Text>
          )} */}
          {/* {note.createdAt && (
             <Text fontSize="xs" color="gray.400" mt={2}>Date: {new Date(note.createdAt).toLocaleString()}</Text>
          )} */}
        </Box>
      ))}
    </VStack>
  );
}

import { Box } from "@chakra-ui/react";

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => (
  <Box p={4} bg="red.50" color="red.600" borderRadius="md" border="1px solid" borderColor="red.200" mb={4}>
    {message}
  </Box>
);

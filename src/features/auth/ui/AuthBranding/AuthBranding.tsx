import { Stack, Box, Heading, Text } from "@chakra-ui/react";
import { FiEdit3 } from "react-icons/fi";

interface AuthBrandingProps {
  title: string;
  description?: string;
}

export const AuthBranding = ({ title, description }: AuthBrandingProps) => {
  return (
    <Stack align="center" textAlign="center" gap={4} mb={2}>
      <Box p={4} bg="teal.500" rounded="2xl" color="white" shadow="lg">
        <FiEdit3 size={32} />
      </Box>
      <Heading fontSize="3xl" fontWeight="bold">
        {title}
      </Heading>
      {description && (
        <Text fontSize="lg" color="gray.600" _dark={{ color: "gray.400" }}>
          {description}
        </Text>
      )}
    </Stack>
  );
};

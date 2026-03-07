import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { type FC } from "react";

interface WelcomeHeroProps {
  username?: string;
  onQuickCreate?: () => void;
}

export const WelcomeHero: FC<WelcomeHeroProps> = ({ username }) => {
  return (
    <Box
      w="full"
      h="full"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={8}
    >
      <VStack gap={6} textAlign="center" maxW="lg">
        <Heading as="h1" size="2xl" color="gray.800">
          Welcome{username ? `, ${username}` : ""}!
        </Heading>
        <Text fontSize="lg" color="gray.600">
          Select a note from the side panel to start editing, or create a new one to capture your thoughts.
        </Text>
      </VStack>
    </Box>
  );
};

import { Flex, Stack, Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
      px={4}
    >
      <Stack gap={8} mx="auto" maxW="lg" w="full" py={12}>
        <Box
          rounded="2xl"
          bg="white"
          _dark={{ bg: "gray.800" }}
          boxShadow="2xl"
          p={{ base: 6, sm: 8 }}
          borderWidth="1px"
        >
          <Stack gap={5}>{children}</Stack>
        </Box>
      </Stack>
    </Flex>
  );
};

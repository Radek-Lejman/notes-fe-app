import { Box, Flex, Heading, HStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  title?: string;
  headerActions?: ReactNode;
}

const MainLayout = ({ children, className, title, headerActions }: MainLayoutProps) => {
  return (
    <Flex direction="column" minH="100vh" className={className}>
      <Flex as="header" justify="space-between" align="center" px="4" py="2" bg="transparent">
        <Heading size="sm" fontWeight="medium" color="gray.500">{title}</Heading>
        <HStack gap={2}>
          {headerActions}
        </HStack>
      </Flex>
      <Box as="main" flex="1" overflow="auto" bg="gray.50" pos="relative">
        <Box maxW="5xl" mx="auto" w="full" h="full" p="4">
          {children}
        </Box>
      </Box>
    </Flex>
  );
};

export default MainLayout;
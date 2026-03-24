import React from 'react';
import { Box, Flex, type BoxProps, type FlexProps } from '@chakra-ui/react';

export const SidePanelRoot: React.FC<FlexProps> = ({ children, ...props }) => {
  return (
    <Flex
      as="aside"
      direction="column"
      w="260px"
      h="100vh"
      bg="gray.50"
      _dark={{ bg: 'gray.900', borderColor: 'gray.800' }}
      borderRightWidth="1px"
      borderColor="gray.200"
      transition="width 0.2s ease"
      {...props}
    >
      {children}
    </Flex>
  );
};

export const SidePanelHeader: React.FC<FlexProps> = ({ children, ...props }) => {
  return (
    <Flex
      px={4}
      py={4}
      alignItems="flex-start"
      direction="column"
      minH="60px"
      flexShrink={0}
      gap={1}
      {...props}
    >
      {children}
    </Flex>
  );
};

export const SidePanelContent: React.FC<FlexProps> = ({ children, ...props }) => {
  return (
    <Flex
      direction="column"
      flex={1}
      overflowY="auto"
      px={3}
      py={2}
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '24px',
        },
      }}
      {...props}
    >
      {children}
    </Flex>
  );
};

export const SidePanelSection: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box mb={6} {...props}>
      {children}
    </Box>
  );
};

export const SidePanelFooter: React.FC<FlexProps> = ({ children, ...props }) => {
  return (
    <Flex
      mt="auto"
      px={4}
      py={3}
      flexShrink={0}
      borderTopWidth="1px"
      borderColor="gray.200"
      _dark={{ borderColor: 'gray.800' }}
      {...props}
    >
      {children}
    </Flex>
  );
};

export const SidePanel = Object.assign(SidePanelRoot, {
  Root: SidePanelRoot,
  Header: SidePanelHeader,
  Content: SidePanelContent,
  Section: SidePanelSection,
  Footer: SidePanelFooter,
});

export default SidePanel;

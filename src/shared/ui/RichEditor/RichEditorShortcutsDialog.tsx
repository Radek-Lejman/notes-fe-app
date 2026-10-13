import { useState } from 'react';
import { Box, CloseButton, Code, Dialog, Flex, Input, Kbd, Portal, Text } from '@chakra-ui/react';
import { formatShortcut, shortcutSections } from '../../lib/editor/commands';
import { useRichEditorContext } from './RichEditorContext';

export const RichEditorShortcutsDialog = () => {
  const { isShortcutsOpen, setShortcutsOpen } = useRichEditorContext();
  const [query, setQuery] = useState('');

  const normalized = query.trim().toLowerCase();
  const sections = shortcutSections
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => entry.label.toLowerCase().includes(normalized)),
    }))
    .filter((section) => section.entries.length > 0);

  return (
    <Dialog.Root
      open={isShortcutsOpen}
      onOpenChange={(event) => setShortcutsOpen(event.open)}
      onExitComplete={() => setQuery('')}
      size="lg"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Keyboard shortcuts</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body display="flex" flexDirection="column" gap={4} pb={6}>
              <Input
                size="sm"
                value={query}
                placeholder="Search shortcuts"
                aria-label="Search shortcuts"
                onChange={(event) => setQuery(event.target.value)}
              />
              {sections.length === 0 && (
                <Text fontSize="sm" color="fg.muted">
                  No shortcut matches “{query}”.
                </Text>
              )}
              {/* Columns instead of a grid: sections of different length pack without gaps. */}
              <Box css={{ columnCount: { base: 1, md: 2 }, columnGap: '2rem' }}>
                {sections.map((section) => (
                  <Box key={section.title} mb={4} css={{ breakInside: 'avoid' }}>
                    <Text
                      fontSize="2xs"
                      fontWeight="semibold"
                      letterSpacing="wider"
                      textTransform="uppercase"
                      color="fg.subtle"
                      mb={1}
                    >
                      {section.title}
                    </Text>
                    {section.entries.map((entry) => (
                      <Flex
                        key={entry.label}
                        align="center"
                        gap={3}
                        py={1.5}
                        borderBottomWidth="1px"
                        borderColor="border.muted"
                        fontSize="sm"
                      >
                        <Text flex="1">{entry.label}</Text>
                        {entry.markdown && (
                          <Code size="sm" variant="surface">
                            {entry.markdown}
                          </Code>
                        )}
                        {entry.shortcut && <Kbd size="sm">{formatShortcut(entry.shortcut)}</Kbd>}
                      </Flex>
                    ))}
                  </Box>
                ))}
              </Box>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

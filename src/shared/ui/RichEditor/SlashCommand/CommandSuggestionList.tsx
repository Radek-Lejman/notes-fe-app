import { useState, useEffect, forwardRef, useImperativeHandle, useRef, Fragment } from 'react';
import { Box, Flex, Kbd, Text } from '@chakra-ui/react';
import { formatShortcut } from '../../../lib/editor/commands';
import { type CommandSuggestionListProps, type CommandSuggestionListRef } from './types';

export const CommandSuggestionList = forwardRef<
  CommandSuggestionListRef,
  CommandSuggestionListProps
>(({ items, query, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (items.length === 0) return false;
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  // Groups only make sense for the full list; a filtered list is ranked by relevance.
  const showGroups = query.trim() === '';

  return (
    <Box
      bg="bg.panel"
      color="fg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      boxShadow="lg"
      w="20rem"
      maxW="calc(100vw - 16px)"
      overflow="hidden"
    >
      <Box role="listbox" aria-label="Insert block" maxH="min(22rem, 50vh)" overflowY="auto" p={1}>
        {items.length === 0 && (
          <Text fontSize="sm" color="fg.muted" px={3} py={3}>
            No matching blocks
          </Text>
        )}
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          const Icon = item.icon;
          const startsGroup = showGroups && item.group !== items[index - 1]?.group;

          return (
            <Fragment key={item.id}>
              {startsGroup && (
                <Text
                  fontSize="2xs"
                  fontWeight="semibold"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  color="fg.subtle"
                  px={2}
                  pt={index === 0 ? 1.5 : 3}
                  pb={1}
                >
                  {item.group}
                </Text>
              )}
              <Flex
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                role="option"
                aria-selected={isSelected}
                align="center"
                gap={2.5}
                px={2}
                py={1.5}
                borderRadius="md"
                cursor="pointer"
                bg={isSelected ? 'bg.muted' : 'transparent'}
                onMouseEnter={() => setSelectedIndex(index)}
                // Keep focus (and the typed "/query") in the editor.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectItem(index)}
              >
                <Flex
                  flex="none"
                  w={8}
                  h={8}
                  align="center"
                  justify="center"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="md"
                  bg="bg"
                  color="fg.muted"
                  fontSize="md"
                >
                  {Icon && <Icon />}
                </Flex>
                <Box minW={0} flex="1">
                  <Text fontSize="sm" fontWeight="medium" lineHeight="short">
                    {item.label}
                  </Text>
                  {item.description && (
                    <Text fontSize="xs" color="fg.muted" truncate>
                      {item.description}
                    </Text>
                  )}
                </Box>
                {item.shortcut && <Kbd size="sm">{formatShortcut(item.shortcut)}</Kbd>}
              </Flex>
            </Fragment>
          );
        })}
      </Box>
      <Flex
        gap={3}
        px={3}
        py={1.5}
        borderTopWidth="1px"
        borderColor="border"
        fontSize="xs"
        color="fg.subtle"
      >
        <Text>↑↓ navigate</Text>
        <Text>↵ select</Text>
        <Text>esc close</Text>
      </Flex>
    </Box>
  );
});

CommandSuggestionList.displayName = 'CommandSuggestionList';

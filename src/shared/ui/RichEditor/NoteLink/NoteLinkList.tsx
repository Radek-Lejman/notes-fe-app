import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { LuFileText, LuPlus } from 'react-icons/lu';
import type { SuggestionListRef } from '../../../lib/editor/extensions/floatingSuggestion';
import type { NoteLinkListProps } from './types';

export const NoteLinkList = forwardRef<SuggestionListRef, NoteLinkListProps>(
  ({ items, query, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useEffect(() => {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
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
          const item = items[selectedIndex];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    return (
      <Box
        bg="bg.panel"
        color="fg"
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
        boxShadow="lg"
        w="22rem"
        maxW="calc(100vw - 16px)"
        overflow="hidden"
      >
        <Text
          fontSize="2xs"
          fontWeight="semibold"
          letterSpacing="wider"
          textTransform="uppercase"
          color="fg.subtle"
          px={3}
          pt={2.5}
          pb={1}
        >
          Link to note
        </Text>
        <Box
          role="listbox"
          aria-label="Link to note"
          maxH="min(20rem, 50vh)"
          overflowY="auto"
          p={1}
        >
          {items.length === 0 && (
            <Text fontSize="sm" color="fg.muted" px={2} py={2}>
              {query.trim() ? 'No notes found' : 'Type to search your notes'}
            </Text>
          )}
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            const isCreate = item.kind === 'create';
            return (
              <Flex
                key={isCreate ? 'create' : item.note.id}
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
                borderTopWidth={isCreate && index > 0 ? '1px' : 0}
                borderColor="border.muted"
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => command(item)}
              >
                <Box flex="none" color={isCreate ? 'blue.fg' : 'fg.muted'}>
                  {isCreate ? <LuPlus /> : <LuFileText />}
                </Box>
                <Box minW={0} flex="1">
                  {isCreate ? (
                    <Text fontSize="sm" fontWeight="medium" color="blue.fg" truncate>
                      Create note “{item.title}”
                    </Text>
                  ) : (
                    <>
                      <Text fontSize="sm" fontWeight="medium" truncate>
                        {item.note.title || 'Untitled'}
                      </Text>
                      {item.note.path && (
                        <Text fontSize="xs" color="fg.muted" truncate>
                          {item.note.path}
                        </Text>
                      )}
                    </>
                  )}
                </Box>
              </Flex>
            );
          })}
        </Box>
      </Box>
    );
  },
);

NoteLinkList.displayName = 'NoteLinkList';

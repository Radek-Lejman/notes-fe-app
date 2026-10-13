import { Box, Button, Flex, HStack, IconButton, Link, Spinner, Text, Wrap } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaRegCopy } from 'react-icons/fa';
import { MarkdownView } from '@shared/ui/MarkdownView';
import { toolActivityLabel } from '../lib/toolActivityLabel';
import type { ChatMessage } from '../model/types';

interface ChatMessageItemProps {
  message: ChatMessage;
  onOpenSettings?: () => void;
}

export const ChatMessageItem = ({ message, onOpenSettings }: ChatMessageItemProps) => {
  if (message.role === 'user') {
    return (
      <Flex justify="flex-end">
        <Box
          maxW="85%"
          bg="blue.500"
          color="white"
          px={3}
          py={2}
          borderRadius="lg"
          whiteSpace="pre-wrap"
          fontSize="sm"
        >
          {message.content}
        </Box>
      </Flex>
    );
  }

  const isStreaming = message.status === 'streaming';
  const copy = () => void navigator.clipboard?.writeText(message.content);

  return (
    <Box
      maxW="100%"
      bg="white"
      _dark={{ bg: 'gray.800' }}
      px={3}
      py={2}
      borderRadius="lg"
      borderWidth="1px"
    >
      {message.content ? (
        <MarkdownView markdown={message.content} />
      ) : (
        isStreaming && !message.activity && <Spinner size="xs" />
      )}

      {isStreaming && message.activity && (
        <HStack gap={2} mt={message.content ? 2 : 0} color="gray.500" fontSize="xs">
          <Spinner size="xs" />
          <Text>{toolActivityLabel(message.activity)}</Text>
        </HStack>
      )}

      {message.status === 'error' && (
        <Box mt={1}>
          <Text color="red.500" fontSize="xs">
            {message.error ?? 'Something went wrong.'}
          </Text>
          {message.errorCode === 'credentials' && onOpenSettings && (
            <Button mt={2} size="xs" colorPalette="blue" onClick={onOpenSettings}>
              Open AI settings
            </Button>
          )}
        </Box>
      )}
      {message.status === 'aborted' && (
        <Text mt={1} color="gray.500" fontSize="xs">
          Stopped.
        </Text>
      )}

      {!!message.sources?.length && (
        <Box mt={2}>
          <Text fontSize="xs" color="gray.500" mb={1}>
            Sources
          </Text>
          <Wrap gap={1}>
            {message.sources.map((source) => (
              <Link
                key={source.id}
                asChild
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="md"
                bg="gray.100"
                _dark={{ bg: 'gray.700' }}
              >
                <RouterLink to={`/note/${source.id}`}>{source.title || 'Untitled'}</RouterLink>
              </Link>
            ))}
          </Wrap>
        </Box>
      )}

      {message.status === 'done' && message.content && (
        <Flex justify="flex-end">
          <IconButton aria-label="Copy answer" size="2xs" variant="ghost" onClick={copy}>
            <FaRegCopy />
          </IconButton>
        </Flex>
      )}
    </Box>
  );
};

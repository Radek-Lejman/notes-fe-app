import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Box, Button, Flex, HStack, Text, Textarea, VStack } from '@chakra-ui/react';
import { FaPaperPlane, FaStop } from 'react-icons/fa';
import { MAX_PROMPT_LENGTH } from '../config/constants';
import { useNoteChat } from '../model/useNoteChat';
import { ChatMessageItem } from './ChatMessageItem';

interface NoteChatProps {
  noteId: string;
  /** Shown as an action when the user has no AI account connected. */
  onOpenSettings?: () => void;
}

export const NoteChat = ({ noteId, onOpenSettings }: NoteChatProps) => {
  const { messages, isStreaming, send, stop, clear } = useNoteChat(noteId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const submit = () => {
    if (!input.trim() || isStreaming) return;
    void send(input);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Flex direction="column" h="full" minH={0}>
      <Box flex="1" overflowY="auto" pr={1}>
        {messages.length === 0 ? (
          <Text color="gray.500" fontSize="sm">
            Ask about this note or anything in your other notes — e.g. &quot;Summarize this
            note&quot; or &quot;What did I write about deployment?&quot;
          </Text>
        ) : (
          <VStack align="stretch" gap={3}>
            {messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} onOpenSettings={onOpenSettings} />
            ))}
          </VStack>
        )}
        <div ref={bottomRef} />
      </Box>

      <Box pt={3}>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI… (Enter to send, Shift+Enter for a new line)"
          maxLength={MAX_PROMPT_LENGTH}
          autoresize
          maxH="40"
          size="sm"
          bg="white"
          _dark={{ bg: 'gray.800' }}
        />
        <HStack justify="space-between" mt={2}>
          <Button size="xs" variant="ghost" onClick={clear} disabled={!messages.length}>
            Clear chat
          </Button>
          {isStreaming ? (
            <Button size="xs" colorPalette="red" variant="outline" onClick={stop}>
              <FaStop /> Stop
            </Button>
          ) : (
            <Button size="xs" colorPalette="blue" onClick={submit} disabled={!input.trim()}>
              <FaPaperPlane /> Send
            </Button>
          )}
        </HStack>
      </Box>
    </Flex>
  );
};

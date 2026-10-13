import { useState } from 'react';
import { Box, Button, CloseButton, Drawer, HStack, IconButton, Portal } from '@chakra-ui/react';
import { FaArrowLeft, FaCog, FaRobot } from 'react-icons/fa';
import { NoteChat } from '@features/ai-chat';
import { AiSettingsPanel } from '@features/ai-settings';
import { useAiSettings } from '@entities/ai-chat';

interface NoteChatWidgetProps {
  noteId: string;
}

type View = 'chat' | 'settings';

/** "Ask AI" button + non-modal side panel, so the note stays editable while chatting. */
export const NoteChatWidget = ({ noteId }: NoteChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chosenView, setChosenView] = useState<View | null>(null);
  const { data: settings } = useAiSettings();

  // Until the user picks a view, start on settings when no AI account is connected yet.
  const view: View = chosenView ?? (settings && !settings.ready ? 'settings' : 'chat');

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(e) => setIsOpen(e.open)}
      placement="end"
      size="md"
      modal={false}
      closeOnInteractOutside={false}
      trapFocus={false}
      preventScroll={false}
    >
      <Drawer.Trigger asChild>
        <Button size="sm" variant="outline">
          <FaRobot /> Ask AI
        </Button>
      </Drawer.Trigger>
      <Portal>
        <Drawer.Positioner pointerEvents="none">
          <Drawer.Content pointerEvents="auto" bg="gray.50" _dark={{ bg: 'gray.900' }}>
            <Drawer.Header>
              <HStack justify="space-between" w="full" pr={8}>
                <Drawer.Title fontSize="md">
                  {view === 'chat' ? 'AI assistant' : 'AI settings'}
                </Drawer.Title>
                <IconButton
                  aria-label={view === 'chat' ? 'AI settings' : 'Back to chat'}
                  size="xs"
                  variant="ghost"
                  onClick={() => setChosenView(view === 'chat' ? 'settings' : 'chat')}
                >
                  {view === 'chat' ? <FaCog /> : <FaArrowLeft />}
                </IconButton>
              </HStack>
            </Drawer.Header>
            <Drawer.Body display="flex" flexDirection="column" minH={0} pb={4}>
              {/* Chat stays mounted (also when closed or on settings), so an answer keeps streaming. */}
              <Box
                display={view === 'chat' ? 'flex' : 'none'}
                flexDirection="column"
                h="full"
                minH={0}
              >
                <NoteChat noteId={noteId} onOpenSettings={() => setChosenView('settings')} />
              </Box>
              {view === 'settings' && <AiSettingsPanel />}
            </Drawer.Body>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};

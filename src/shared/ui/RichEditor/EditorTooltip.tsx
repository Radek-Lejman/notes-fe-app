import { Flex, Portal, Text, Tooltip } from '@chakra-ui/react';
import type React from 'react';
import { formatShortcut } from '../../lib/editor/commands';

interface EditorTooltipProps {
  label: string;
  shortcut?: string;
  children: React.ReactElement;
}

/** Action name plus its keyboard shortcut, so the menus teach the shortcuts. */
export const EditorTooltip = ({ label, shortcut, children }: EditorTooltipProps) => (
  <Tooltip.Root openDelay={400} closeDelay={0} positioning={{ placement: 'top' }}>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Portal>
      <Tooltip.Positioner>
        <Tooltip.Content>
          <Flex gap={2} align="center">
            <Text>{label}</Text>
            {shortcut && <Text opacity={0.65}>{formatShortcut(shortcut)}</Text>}
          </Flex>
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Portal>
  </Tooltip.Root>
);

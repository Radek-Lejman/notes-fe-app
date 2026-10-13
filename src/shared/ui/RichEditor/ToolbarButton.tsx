import { forwardRef } from 'react';
import type React from 'react';
import { IconButton } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { EditorTooltip } from './EditorTooltip';

interface ToolbarButtonProps {
  label: string;
  shortcut?: string;
  icon: IconType;
  isActive?: boolean;
  size?: 'xs' | 'sm' | 'md';
  onClick: () => void;
}

/**
 * Icon button for the editor's menus. It never takes focus, so the editor keeps its focus and
 * selection while formatting.
 */
export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ label, shortcut, icon: Icon, isActive = false, size = 'xs', onClick }, ref) => (
    <EditorTooltip label={label} shortcut={shortcut}>
      <IconButton
        ref={ref}
        aria-label={label}
        aria-pressed={isActive}
        size={size}
        variant={isActive ? 'subtle' : 'ghost'}
        colorPalette={isActive ? 'blue' : 'gray'}
        onMouseDown={(event: React.MouseEvent) => event.preventDefault()}
        onClick={onClick}
      >
        <Icon />
      </IconButton>
    </EditorTooltip>
  ),
);
ToolbarButton.displayName = 'ToolbarButton';

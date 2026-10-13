import { blockCommands } from './blockCommands';
import { markCommands } from './markCommands';
import type { EditorCommand, ShortcutSection } from './types';

const MAC_KEYS: Record<string, string> = {
  Mod: '⌘',
  Shift: '⇧',
  Alt: '⌥',
  Ctrl: '⌃',
  Enter: '↵',
  Escape: 'Esc',
  ArrowUp: '↑',
  ArrowDown: '↓',
};

const OTHER_KEYS: Record<string, string> = {
  Mod: 'Ctrl',
  Enter: 'Enter',
  Escape: 'Esc',
  ArrowUp: '↑',
  ArrowDown: '↓',
};

export const isMacPlatform = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

/** `Mod-Shift-8` -> `⌘⇧8` on macOS, `Ctrl+Shift+8` elsewhere. */
export const formatShortcut = (shortcut: string, mac = isMacPlatform()): string => {
  // A trailing `-` is the minus key itself (`Mod--`), not a separator.
  const keys = shortcut.endsWith('--')
    ? [...shortcut.slice(0, -2).split('-'), '-']
    : shortcut.split('-');
  const names = mac ? MAC_KEYS : OTHER_KEYS;
  const labels = keys.map((key) => names[key] ?? (key.length === 1 ? key.toUpperCase() : key));
  return labels.join(mac ? '' : '+');
};

export const shortcutSections: ShortcutSection[] = [
  {
    title: 'Formatting',
    entries: Object.values<EditorCommand>(markCommands).map(({ label, shortcut, markdown }) => ({
      label,
      shortcut,
      markdown,
    })),
  },
  {
    title: 'Blocks',
    entries: blockCommands.map(({ label, shortcut, markdown }) => ({ label, shortcut, markdown })),
  },
  {
    title: 'Editing',
    entries: [
      { label: 'Insert block', shortcut: '/' },
      { label: 'Line break', shortcut: 'Shift-Enter' },
      { label: 'Indent list item', shortcut: 'Tab' },
      { label: 'Outdent list item', shortcut: 'Shift-Tab' },
      { label: 'Link to a note', markdown: '[[' },
      { label: 'Open link', shortcut: 'Mod-Click' },
      { label: 'Move block up', shortcut: 'Mod-Shift-ArrowUp' },
      { label: 'Move block down', shortcut: 'Mod-Shift-ArrowDown' },
      { label: 'Duplicate block', shortcut: 'Mod-D' },
      { label: 'Ask AI', shortcut: 'Mod-J' },
      { label: 'Close menu', shortcut: 'Escape' },
      { label: 'Undo', shortcut: 'Mod-Z' },
      { label: 'Redo', shortcut: 'Mod-Shift-Z' },
      { label: 'Save now', shortcut: 'Mod-S' },
      { label: 'Keyboard shortcuts', shortcut: 'Mod-/' },
    ],
  },
];

# Concept: a professional note editor (Tiptap)

Status: proposal · 2026-10-11

## 1. Current state — diagnosis

The editor (`src/shared/ui/RichEditor`) works correctly, but looks and behaves like the Tiptap demo.

| Area               | What exists                                                                                                                                                 | Problem                                                                                                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keyboard shortcuts | StarterKit **already provides** `⌘B`, `⌘I`, `⌘E`, `⌘⇧S`, `⌘⌥1–6`, `⌘⇧7/8`, `⌘⇧B`, `⌘⌥C`, `⌘Z/⌘⇧Z` and input rules (`# `, `- `, `1. `, `> `, ` ``` `, `---`) | They are invisible: no hints in menus, no cheat sheet. Key ones are missing: `⌘K` (link), task list, moving blocks, forcing a save                                                                                                    |
| Slash menu         | A flat list of 21 items, text only, a limit of 10 results                                                                                                   | No groups, icons, descriptions, shortcuts or aliases (`h1`, `todo`). Mixes blocks with formatting and actions (`Bold`, `Undo`, `Clear marks`) that do not belong there. Hard-coded colours (`bg="white"`), so dark mode does not work |
| Bubble menu        | 4 buttons (B, I, S, Code)                                                                                                                                   | No link, block type switch, clear formatting, or tooltips with shortcuts                                                                                                                                                              |
| Links              | `Link` is enabled in StarterKit                                                                                                                             | There is no UI to add, edit or remove a link                                                                                                                                                                                          |
| Typography         | Styles for p, h1–h3 and lists                                                                                                                               | h4–h6, blockquote, code, pre, hr and links have no styles. Hard-coded colours (`#2d3748`), no dark mode                                                                                                                               |
| Blocks             | Only what StarterKit has                                                                                                                                    | No task list, tables, syntax highlighting, callout, `[[note]]` links                                                                                                                                                                  |
| Architecture       | Commands scattered: `menu.config.ts` + a `switch` in `editorActions.ts` + hard-coded buttons in BubbleMenu                                                  | Every new feature needs changes in 3 places, and shortcuts have nowhere to be displayed                                                                                                                                               |

## 2. Target experience

Reference points: Notion, Linear, Obsidian (Live Preview), Craft.

### 2.1 Principles

1. **Keyboard first.** Every action has a shortcut, and every shortcut is visible where the action is.
2. **Markdown is the source of truth.** We only add what has a lossless (GFM/Obsidian) markdown representation, because notes are stored and indexed in RAG that way. Hence we do **not** add underline, text colours or alignment.
3. **One source of commands.** The slash menu, bubble menu, shortcuts and cheat sheet use the same registry.
4. **Theme consistency.** Chakra tokens only, works in light and dark mode.

### 2.2 Keyboard shortcuts

`Mod` = `⌘` on macOS, `Ctrl` on Windows/Linux. Displayed per platform.

**Text formatting**

| Action           | Shortcut      | Markdown   | Status                              |
| ---------------- | ------------- | ---------- | ----------------------------------- |
| Bold             | `Mod+B`       | `**x**`    | exists (hidden)                     |
| Italic           | `Mod+I`       | `*x*`      | exists (hidden)                     |
| Strikethrough    | `Mod+Shift+S` | `~~x~~`    | exists (hidden)                     |
| Inline code      | `Mod+E`       | `` `x` ``  | exists (hidden)                     |
| Link             | `Mod+K`       | `[x](url)` | **new**                             |
| Highlight        | `Mod+Shift+H` | `==x==`    | **new** (optional, Obsidian syntax) |
| Clear formatting | `Mod+\`       | —          | **new**                             |

**Blocks**

| Action                  | Shortcut            | Markdown            | Status          |
| ----------------------- | ------------------- | ------------------- | --------------- |
| Text (paragraph)        | `Mod+Alt+0`         | —                   | **new**         |
| Heading 1–3             | `Mod+Alt+1…3`       | `# `, `## `, `### ` | exists (hidden) |
| Bulleted list           | `Mod+Shift+8`       | `- `                | exists (hidden) |
| Numbered list           | `Mod+Shift+7`       | `1. `               | exists (hidden) |
| Task list               | `Mod+Shift+9`       | `[] ` / `- [ ] `    | **new**         |
| Quote                   | `Mod+Shift+B`       | `> `                | exists (hidden) |
| Code block              | `Mod+Alt+C`         | ` ``` `             | exists (hidden) |
| Callout                 | —                   | `> [!note] `        | **new**         |
| Divider                 | —                   | `---`               | exists          |
| Indent / outdent a list | `Tab` / `Shift+Tab` | —                   | exists          |

**Editing and navigation**

| Action                 | Shortcut                                         | Status  |
| ---------------------- | ------------------------------------------------ | ------- |
| Move block up / down   | `Mod+Shift+↑/↓`                                  | **new** |
| Duplicate block        | `Mod+D`                                          | **new** |
| Select the whole block | `Esc` (when no menu is open)                     | **new** |
| Save now               | `Mod+S` (intercepted, calls `commitEditorState`) | **new** |
| Insert a note link     | `[[`                                             | **new** |
| Command menu           | `/`                                              | exists  |
| Shortcut cheat sheet   | `Mod+/`                                          | **new** |
| Undo / redo            | `Mod+Z` / `Mod+Shift+Z`                          | exists  |

### 2.3 Slash menu (`/`)

```
┌──────────────────────────────────────────────┐
│ BASIC BLOCKS                                 │
│ ▸ ¶  Text           Plain paragraph   ⌘⌥0    │
│   H1 Heading 1      Big section title ⌘⌥1    │
│   H2 Heading 2                         ⌘⌥2    │
│ LISTS                                        │
│   •  Bulleted list                    ⌘⇧8    │
│   ☑  To-do list     Track tasks       ⌘⇧9    │
│ ADVANCED                                     │
│   </> Code block    With syntax hl.   ⌘⌥C    │
│   ▦  Table          3×3               —      │
│   💡 Callout                          —      │
│ NOTES                                        │
│   ↳  Sub-note       Create nested note       │
│   🔗 Link to note   [[                       │
│ AI                                           │
│   ✨ Ask AI…        Continue / summarize     │
├──────────────────────────────────────────────┤
│ ↑↓ navigate   ↵ select   esc close           │
└──────────────────────────────────────────────┘
```

- Groups, icon, title, short description, shortcut aligned right.
- Search by title **and aliases** (`h1`, `#`, `todo`, `check`, `quote`, `>`, `code`, `table`), ranked: exact match > prefix > contains.
- Blocks and inserts only. Formatting (bold, …) and undo/redo go away from here, because they are in the bubble menu and under shortcuts.
- No 10-result limit: scrolling that keeps keyboard navigation. Mouse and keyboard share the selection (hover sets `selectedIndex`).
- A footer with key hints. Empty result: "No results — press Esc".
- Positioning: replace `tippy.js` with `@floating-ui/dom` (Tiptap v3 uses it itself, and tippy is no longer developed). The menu automatically flips above the cursor near the bottom edge.

### 2.4 Bubble menu (selection)

```
┌───────────┬────────────────────┬──────┬─────────┬───────────┐
│ Text ▾    │ B  I  S  <>  ==    │ 🔗   │ ✕ clear │ ✨ Ask AI │
└───────────┴────────────────────┴──────┴─────────┴───────────┘
```

- **Turn into ▾**: change the block type (Text, H1–H3, lists, quote, code, callout), with the current value checked.
- Every button has a tooltip with its name and shortcut: "Bold ⌘B".
- The menu is hidden in code blocks and on a node selection (e.g. pageReference).
- **Ask AI**: sends the selected fragment to the existing note chat endpoint (`/ai`), e.g. "Explain", "Summarize", "Rewrite". Connects the editor with the AI module.

### 2.5 Links

- `Mod+K` with a selection opens a popover with a URL field. Without a selection it inserts a link with text.
- Pasting a URL onto selected text creates a link. Autolink while typing.
- Hovering a link: a small popover `open ↗ · edit · remove`.
- **`[[`** opens a note search (the same `@tiptap/suggestion` mechanics as `/`). Choosing inserts the existing `pageReference` node, and a "Create "…"" option creates a new note. For a note-taking app this is the biggest win on the whole list.

### 2.6 Block handle

On hovering a block, on the left (there is already room for it: `padding-left: 2rem` and an unused `.openDropdown` class):

```
 ＋ ⋮⋮  Paragraph content…
```

- `＋` inserts an empty block below and opens the slash menu.
- `⋮⋮` lets you drag the block, and clicking it opens a menu: Turn into, Duplicate, Copy link to block, Delete.
- Implementation: `@tiptap/extension-drag-handle-react`.

### 2.7 New blocks (with markdown support)

| Block                                 | Extension                                            | Markdown               | Priority            |
| ------------------------------------- | ---------------------------------------------------- | ---------------------- | ------------------- |
| Task list                             | `@tiptap/extension-list` (`TaskList`, `TaskItem`)    | `- [ ] x` / `- [x] x`  | high                |
| Syntax highlighting + language picker | `@tiptap/extension-code-block-lowlight` + `lowlight` | ` ```ts `              | high                |
| Table                                 | `@tiptap/extension-table`                            | GFM table              | medium              |
| Callout                               | a custom node                                        | `> [!note]` (Obsidian) | medium              |
| Highlight                             | `@tiptap/extension-highlight`                        | `==x==`                | low                 |
| Image                                 | `@tiptap/extension-image` + upload to the BE         | `![alt](url)`          | low (needs storage) |

Every new block must pass a markdown → doc → markdown round-trip test (`markdown.test.ts` + a fixture). (Originally it also had to be added to the BE converter `notes-app-be/src/modules/notes/utils/markdown/markdownExtensions.ts`; since BE ADR 0003 the serializer lives only in the FE.)

### 2.8 Typography and appearance

- Full prose styles: h1–h6, blockquote (left border, greyed text), `code` (background, radius, monospace), `pre` (background, padding, horizontal scrolling, a language label), `hr`, links (brand colour, underline on hover), task checkboxes (strikethrough when checked), tables.
- All colours from Chakra tokens (`fg`, `fg.muted`, `bg.subtle`, `border`) or CSS variables, so dark mode works without conditionals.
- A placeholder on **every** empty block with the cursor, depending on the type: "Heading 1", "List", "Type '/' for commands".
- Selection colour in brand colours, a visible `gapcursor` and `dropcursor`.
- Text width around 70ch (`maxW="800px"` already exists) and consistent spacing between blocks (a 0.75em rhythm).

### 2.9 Help and discoverability

- **Shortcut cheat sheet** (`Mod+/` and a `?` button in the corner): a modal with Formatting / Blocks / Editing / Markdown sections, generated from the command registry.
- A word and character counter in the footer next to the "Saved" status (`@tiptap/extension-character-count` is already installed).
- Optionally: a table of contents (outline) from headings for long notes.

## 3. Architecture

### 3.1 Command registry: a single source of truth

Replaces `menu.config.ts` and the `switch` in `editorActions.ts`.

```ts
// src/shared/lib/editor/commands/types.ts
export interface EditorCommand {
  id: string; // 'heading1'
  label: string; // 'Heading 1'
  description?: string; // 'Big section title'
  icon: IconType; // react-icons
  group: 'basic' | 'lists' | 'advanced' | 'format' | 'notes' | 'ai';
  keywords?: string[]; // ['h1', '#', 'title']
  shortcut?: string; // 'Mod-Alt-1' (ProseMirror format)
  markdownHint?: string; // '# '
  surfaces: Array<'slash' | 'bubble' | 'turnInto' | 'help'>;
  run: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
  canRun?: (editor: Editor) => boolean;
}
```

- `slash`: filter `surfaces.includes('slash')`, grouped by `group`.
- `bubble` and `turnInto`: buttons and a dropdown with `isActive` and `canRun`.
- `help`: the shortcut cheat sheet.
- The `KeyboardShortcuts` extension registers `addKeyboardShortcuts()` **only for new shortcuts** (the StarterKit ones stay in StarterKit, and the registry only describes them, to avoid double bindings).
- Features (e.g. `manage-notes`) add their own commands, like `customSlashItems` today (Sub-note, Link to note).
- `formatShortcut('Mod-Alt-1')` returns `⌘⌥1` or `Ctrl+Alt+1` depending on the platform.

### 3.2 File structure (FSD)

```
src/shared/lib/editor/
  commands/            # registry, types, formatShortcut, filter/ranking
  extensions/          # SlashCommand, KeyboardShortcuts, BlockMove, NoteLinkSuggestion, Callout
  markdown/            # unchanged + new nodes
src/shared/ui/RichEditor/
  SlashMenu/           # groups, icons, footer
  BubbleMenu/          # TurnIntoDropdown, MarkButtons, LinkButton
  LinkPopover/
  BlockHandle/
  ShortcutsDialog/
  RichEditor.module.css → tokens and dark mode
```

### 3.3 Backend synchronization

Originally: every new node or mark had to go into `createMarkdownExtensions()` on both sides, otherwise the BE (RAG indexing, AI tools) would lose or misrepresent the content, and a shared package (e.g. `packages/editor-schema`) was considered once more nodes appear. Since BE ADR 0003 the BE stores and indexes markdown as plain text and has no serializer, so no synchronization is needed.

## 4. Rollout plan

**Stage 1: discoverability and appearance (quick wins, no schema or BE changes)**

1. Command registry and rewiring the slash menu and bubble menu.
2. New slash menu: groups, icons, descriptions, shortcuts, aliases, dark mode.
3. Extended bubble menu: Turn into, tooltips with shortcuts, link.
4. Link: `Mod+K`, edit popover, pasting a URL.
5. Full typography and dark mode in `RichEditor.module.css`.
6. Shortcut cheat sheet (`Mod+/`), `Mod+S`, word counter.

**Stage 2: new blocks (schema change, needs fixtures)**

1. Task list.
2. Code blocks with syntax highlighting and a language picker.
3. `[[` note link (based on `pageReference`).
4. Tables and callout.

**Stage 3: advanced**

1. Block handle: drag & drop and a block menu.
2. `Mod+Shift+↑/↓`, `Mod+D`.
3. Ask AI on a selection.
4. Find and replace (`Mod+F` within a note), outline, images with upload.

## 5. Decisions to make

- **Highlight `==x==` and callout `> [!note]`**: this is Obsidian syntax, not GFM. Do we accept extended markdown, or stick to pure GFM?
- **Images**: they need storage (S3/local) and an upload endpoint, so a separate backend topic.
- **A shared FE/BE schema package**: now, or only when a third or fourth new node appears? (Moot since BE ADR 0003.)
- **Mobile**: the bubble menu and block handle on touch. Probably a toolbar above the keyboard instead.

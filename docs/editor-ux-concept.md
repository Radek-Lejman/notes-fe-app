# Koncepcja: profesjonalny edytor notatek (Tiptap)

Status: propozycja · 2026-10-11

## 1. Stan obecny — diagnoza

Edytor (`src/shared/ui/RichEditor`) działa poprawnie, ale wygląda i zachowuje się jak demo Tiptapa.

| Obszar | Co jest | Problem |
|---|---|---|
| Skróty klawiszowe | StarterKit **już daje** `⌘B`, `⌘I`, `⌘E`, `⌘⇧S`, `⌘⌥1–6`, `⌘⇧7/8`, `⌘⇧B`, `⌘⌥C`, `⌘Z/⌘⇧Z` oraz input rules (`# `, `- `, `1. `, `> `, ```` ``` ````, `---`) | Są niewidoczne: brak podpowiedzi w menu, brak ściągi. Brakuje kluczowych: `⌘K` (link), task list, przenoszenie bloków, wymuszenie zapisu |
| Slash menu | Płaska lista 21 pozycji, sam tekst, limit 10 wyników | Brak grup, ikon, opisów, skrótów i aliasów (`h1`, `todo`). Miesza bloki z formatowaniem i akcjami (`Bold`, `Undo`, `Clear marks`), które tam nie pasują. Kolory wpisane na sztywno (`bg="white"`), więc dark mode nie działa |
| Bubble menu | 4 przyciski (B, I, S, Code) | Brak linku, zamiany typu bloku, czyszczenia formatowania, tooltipów ze skrótami |
| Linki | `Link` jest włączony w StarterKit | Nie ma UI do dodania, edycji ani usunięcia linku |
| Typografia | Style dla p, h1–h3 i list | h4–h6, blockquote, code, pre, hr i linki nie mają stylów. Kolory na sztywno (`#2d3748`), bez dark mode |
| Bloki | Tylko to, co jest w StarterKit | Brak listy zadań, tabel, podświetlania składni, callout, linków `[[notatka]]` |
| Architektura | Komendy rozproszone: `menu.config.ts` + `switch` w `editorActions.ts` + zakodowane na sztywno przyciski w BubbleMenu | Każda nowa funkcja wymaga zmian w 3 miejscach, a skróty nie mają gdzie się wyświetlić |

## 2. Docelowe doświadczenie

Punkty odniesienia: Notion, Linear, Obsidian (Live Preview), Craft.

### 2.1 Zasady

1. **Klawiatura przede wszystkim.** Każda akcja ma skrót, a każdy skrót jest widoczny tam, gdzie jest akcja.
2. **Markdown jest źródłem prawdy.** Dodajemy tylko to, co ma bezstratny zapis w (GFM/Obsidian) markdown, bo notatki są tak przechowywane i indeksowane w RAG. Stąd **nie** dodajemy podkreślenia, kolorów tekstu ani wyrównania.
3. **Jedno źródło komend.** Slash menu, bubble menu, skróty i ściąga korzystają z tego samego rejestru.
4. **Spójność z motywem.** Wyłącznie tokeny Chakra, działa w trybie jasnym i ciemnym.

### 2.2 Skróty klawiszowe

`Mod` = `⌘` na macOS, `Ctrl` na Windows/Linux. Wyświetlane zależnie od platformy.

**Formatowanie tekstu**

| Akcja | Skrót | Markdown | Status |
|---|---|---|---|
| Pogrubienie | `Mod+B` | `**x**` | jest (ukryty) |
| Kursywa | `Mod+I` | `*x*` | jest (ukryty) |
| Przekreślenie | `Mod+Shift+S` | `~~x~~` | jest (ukryty) |
| Kod inline | `Mod+E` | `` `x` `` | jest (ukryty) |
| Link | `Mod+K` | `[x](url)` | **nowy** |
| Podświetlenie | `Mod+Shift+H` | `==x==` | **nowy** (opcjonalny, składnia Obsidiana) |
| Wyczyść formatowanie | `Mod+\` | — | **nowy** |

**Bloki**

| Akcja | Skrót | Markdown | Status |
|---|---|---|---|
| Tekst (paragraf) | `Mod+Alt+0` | — | **nowy** |
| Nagłówek 1–3 | `Mod+Alt+1…3` | `# `, `## `, `### ` | jest (ukryty) |
| Lista punktowana | `Mod+Shift+8` | `- ` | jest (ukryty) |
| Lista numerowana | `Mod+Shift+7` | `1. ` | jest (ukryty) |
| Lista zadań | `Mod+Shift+9` | `[] ` / `- [ ] ` | **nowy** |
| Cytat | `Mod+Shift+B` | `> ` | jest (ukryty) |
| Blok kodu | `Mod+Alt+C` | ```` ``` ```` | jest (ukryty) |
| Callout | — | `> [!note] ` | **nowy** |
| Separator | — | `---` | jest |
| Wcięcie / wysunięcie listy | `Tab` / `Shift+Tab` | — | jest |

**Edycja i nawigacja**

| Akcja | Skrót | Status |
|---|---|---|
| Przenieś blok w górę / w dół | `Mod+Shift+↑/↓` | **nowy** |
| Duplikuj blok | `Mod+D` | **nowy** |
| Zaznacz cały blok | `Esc` (gdy menu zamknięte) | **nowy** |
| Zapisz teraz | `Mod+S` (przechwycony, wywołuje `commitEditorState`) | **nowy** |
| Wstaw link do notatki | `[[` | **nowy** |
| Menu komend | `/` | jest |
| Ściąga skrótów | `Mod+/` | **nowy** |
| Cofnij / ponów | `Mod+Z` / `Mod+Shift+Z` | jest |

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

- Grupy, ikona, tytuł, krótki opis, skrót wyrównany do prawej.
- Wyszukiwanie po tytule **i aliasach** (`h1`, `#`, `todo`, `check`, `quote`, `>`, `code`, `table`), z rankingiem: dokładne trafienie > prefiks > zawieranie.
- Tylko bloki i wstawki. Formatowanie (bold, …) i undo/redo wylatują stąd, bo są w bubble menu i pod skrótami.
- Bez limitu 10 wyników: przewijanie z zachowaniem nawigacji klawiaturą. Mysz i klawiatura współdzielą zaznaczenie (hover ustawia `selectedIndex`).
- Stopka z podpowiedziami klawiszy. Pusty wynik: „No results — press Esc".
- Pozycjonowanie: zamiana `tippy.js` na `@floating-ui/dom` (Tiptap v3 sam z niego korzysta, a tippy nie jest już rozwijany). Menu automatycznie odwraca się nad kursor przy dolnej krawędzi.

### 2.4 Bubble menu (zaznaczenie)

```
┌───────────┬────────────────────┬──────┬─────────┬───────────┐
│ Text ▾    │ B  I  S  <>  ==    │ 🔗   │ ✕ clear │ ✨ Ask AI │
└───────────┴────────────────────┴──────┴─────────┴───────────┘
```

- **Turn into ▾**: zmiana typu bloku (Text, H1–H3, listy, cytat, kod, callout), z zaznaczoną aktualną wartością.
- Każdy przycisk ma tooltip z nazwą i skrótem: „Bold ⌘B".
- Menu ukryte w blokach kodu i na zaznaczeniu węzła (np. pageReference).
- **Ask AI**: wysyła zaznaczony fragment do istniejącego endpointu czatu notatek (`/ai`), np. „Explain", „Summarize", „Rewrite". Spina edytor z modułem AI.

### 2.5 Linki

- `Mod+K` przy zaznaczeniu otwiera popover z polem URL. Bez zaznaczenia wstawia link z tekstem.
- Wklejenie URL na zaznaczony tekst tworzy link. Autolink podczas pisania.
- Najechanie na link: mały popover `otwórz ↗ · edytuj · usuń`.
- **`[[`** otwiera wyszukiwarkę notatek (ta sama mechanika `@tiptap/suggestion` co `/`). Wybór wstawia istniejący węzeł `pageReference`, a opcja „Create “…”" tworzy nową notatkę. Dla aplikacji do notatek to największy zysk z całej listy.

### 2.6 Uchwyt bloku (block handle)

Po najechaniu na blok, po lewej (miejsce na to już jest: `padding-left: 2rem` i nieużywana klasa `.openDropdown`):

```
 ＋ ⋮⋮  Treść akapitu…
```

- `＋` wstawia pusty blok poniżej i otwiera slash menu.
- `⋮⋮` daje przeciąganie bloku, a kliknięcie otwiera menu: Turn into, Duplicate, Copy link to block, Delete.
- Implementacja: `@tiptap/extension-drag-handle-react`.

### 2.7 Nowe bloki (z obsługą markdown)

| Blok | Rozszerzenie | Markdown | Priorytet |
|---|---|---|---|
| Lista zadań | `@tiptap/extension-list` (`TaskList`, `TaskItem`) | `- [ ] x` / `- [x] x` | wysoki |
| Podświetlanie składni + wybór języka | `@tiptap/extension-code-block-lowlight` + `lowlight` | ```` ```ts ```` | wysoki |
| Tabela | `@tiptap/extension-table` | tabela GFM | średni |
| Callout | własny node | `> [!note]` (Obsidian) | średni |
| Podświetlenie | `@tiptap/extension-highlight` | `==x==` | niski |
| Obraz | `@tiptap/extension-image` + upload na BE | `![alt](url)` | niski (wymaga storage) |

Każdy nowy blok musi przejść test round-trip markdown → doc → markdown (`markdown.test.ts` + fixture) **i** być dodany do konwertera w `notes-app-be/src/modules/notes/utils/markdown/markdownExtensions.ts` (plik oznaczony „KEEP IN SYNC").

### 2.8 Typografia i wygląd

- Pełne style prose: h1–h6, blockquote (lewa krawędź, wyszarzony tekst), `code` (tło, radius, monospace), `pre` (tło, padding, przewijanie poziome, etykieta języka), `hr`, linki (kolor marki, podkreślenie przy hover), checkboxy zadań (przekreślenie po odhaczeniu), tabele.
- Wszystkie kolory z tokenów Chakra (`fg`, `fg.muted`, `bg.subtle`, `border`) albo CSS variables, więc dark mode działa bez warunków.
- Placeholder na **każdym** pustym bloku z kursorem, zależny od typu: „Heading 1", „List", „Type '/' for commands".
- Kolor zaznaczenia w barwach marki, widoczny `gapcursor` i `dropcursor`.
- Szerokość tekstu ok. 70ch (już jest `maxW="800px"`) i spójne odstępy między blokami (rytm 0.75em).

### 2.9 Pomoc i odkrywalność

- **Ściąga skrótów** (`Mod+/` oraz przycisk `?` w rogu): modal z sekcjami Formatowanie / Bloki / Edycja / Markdown, generowany z rejestru komend.
- Licznik słów i znaków w stopce obok statusu „Saved" (`@tiptap/extension-character-count` jest już zainstalowany).
- Opcjonalnie: spis treści (outline) z nagłówków dla długich notatek.

## 3. Architektura

### 3.1 Rejestr komend: jedno źródło prawdy

Zastępuje `menu.config.ts` i `switch` w `editorActions.ts`.

```ts
// src/shared/lib/editor/commands/types.ts
export interface EditorCommand {
  id: string;                         // 'heading1'
  label: string;                      // 'Heading 1'
  description?: string;               // 'Big section title'
  icon: IconType;                     // react-icons
  group: 'basic' | 'lists' | 'advanced' | 'format' | 'notes' | 'ai';
  keywords?: string[];                // ['h1', '#', 'title']
  shortcut?: string;                  // 'Mod-Alt-1' (format ProseMirror)
  markdownHint?: string;              // '# '
  surfaces: Array<'slash' | 'bubble' | 'turnInto' | 'help'>;
  run: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
  canRun?: (editor: Editor) => boolean;
}
```

- `slash`: filtr `surfaces.includes('slash')`, grupowanie po `group`.
- `bubble` i `turnInto`: przyciski i dropdown z `isActive` i `canRun`.
- `help`: ściąga skrótów.
- `KeyboardShortcuts` extension rejestruje `addKeyboardShortcuts()` **tylko dla nowych skrótów** (te ze StarterKit zostają w StarterKit, a rejestr je tylko opisuje, żeby nie było podwójnych bindingów).
- Funkcje (np. `manage-notes`) dorzucają własne komendy, tak jak dziś `customSlashItems` (Sub-note, Link to note).
- `formatShortcut('Mod-Alt-1')` zwraca `⌘⌥1` lub `Ctrl+Alt+1` zależnie od platformy.

### 3.2 Struktura plików (FSD)

```
src/shared/lib/editor/
  commands/            # rejestr, typy, formatShortcut, filtr/ranking
  extensions/          # SlashCommand, KeyboardShortcuts, BlockMove, NoteLinkSuggestion, Callout
  markdown/            # bez zmian + nowe węzły (KEEP IN SYNC z BE)
src/shared/ui/RichEditor/
  SlashMenu/           # grupy, ikony, stopka
  BubbleMenu/          # TurnIntoDropdown, MarkButtons, LinkButton
  LinkPopover/
  BlockHandle/
  ShortcutsDialog/
  RichEditor.module.css → tokeny i dark mode
```

### 3.3 Synchronizacja z backendem

Każdy nowy węzeł lub mark trafia do `createMarkdownExtensions()` po obu stronach, inaczej BE (indeksowanie RAG, narzędzia AI) zgubi treść albo ją przekłamie. Gdy węzłów przybędzie, warto wydzielić wspólny pakiet (np. `packages/editor-schema`) zamiast ręcznej synchronizacji.

## 4. Plan wdrożenia

**Etap 1: odkrywalność i wygląd (szybkie efekty, bez zmian w schemacie i na BE)**
1. Rejestr komend i przepięcie slash menu oraz bubble menu.
2. Nowe slash menu: grupy, ikony, opisy, skróty, aliasy, dark mode.
3. Rozbudowane bubble menu: Turn into, tooltipy ze skrótami, link.
4. Link: `Mod+K`, popover edycji, wklejanie URL.
5. Pełna typografia oraz dark mode w `RichEditor.module.css`.
6. Ściąga skrótów (`Mod+/`), `Mod+S`, licznik słów.

**Etap 2: nowe bloki (zmiana schematu, wymaga sync z BE i fixture)**
1. Lista zadań.
2. Bloki kodu z podświetlaniem składni i wyborem języka.
3. `[[` link do notatki (na bazie `pageReference`).
4. Tabele i callout.

**Etap 3: zaawansowane**
1. Uchwyt bloku: drag & drop i menu bloku.
2. `Mod+Shift+↑/↓`, `Mod+D`.
3. Ask AI na zaznaczeniu.
4. Szukaj i zamień (`Mod+F` w obrębie notatki), outline, obrazy z uploadem.

## 5. Decyzje do podjęcia

- **Podświetlenie `==x==` i callout `> [!note]`**: to składnia Obsidiana, a nie GFM. Akceptujemy rozszerzony markdown, czy trzymamy się czystego GFM?
- **Obrazy**: wymagają storage (S3/lokalny) i endpointu uploadu, więc to osobny temat backendowy.
- **Wspólny pakiet schematu FE/BE**: teraz, czy dopiero gdy pojawi się trzeci lub czwarty nowy węzeł?
- **Mobile**: bubble menu i uchwyt bloku na dotyku. Prawdopodobnie zamiast nich pasek narzędzi nad klawiaturą.

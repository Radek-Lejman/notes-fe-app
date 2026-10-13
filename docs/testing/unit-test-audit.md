# Audyt testów jednostkowych FE

Status: zrealizowany · 2026-10-11 · zakres: `notes-app-fe/src` (vitest + Testing Library, jsdom)

## 1. Wymagania, względem których robiony był audyt

| Źródło | Wymaganie |
|---|---|
| `notes-app-be/docs/ai-dev-system/KONCEPCJA.md` §4 | Unit (vitest) pokrywa: utils, mappery, serwisy, **hooki i komponenty FE** |
| KONCEPCJA §4 | Bez twardego progu coverage na start; jakość testów ważniejsza niż procent (test musi realnie asercją sprawdzać zachowanie, nie „not throw”) |
| KONCEPCJA §1 pkt 1, §3 | Wynik weryfikują deterministyczne narzędzia: `vitest run`, `tsc -b`, `eslint`, `prettier --check` muszą być zielone |
| `.agents/rules/review.md` | Edge case'y, a nie tylko happy path; testy zachowania, nie implementacji; brak „testów, które nic nie testują”; brak cichych catchy |
| `.agents/rules/fsd_architecture.md` + ESLint `feature-sliced` | Testy i helpery respektują warstwy FSD (bez importów w górę, względne ścieżki wewnątrz warstwy) |

## 2. Stan wyjściowy (zmierzony)

- 10 plików testów, 129 testów, wszystkie zielone.
- Brak narzędzia coverage, brak pliku setup, brak helperów (każdy test sam składał providery).
- Pokrycie (ta sama konfiguracja co w §5): **30,7% instrukcji · 46,1% funkcji**.
- Dobrze pokryte było tylko jądro edytora: `shared/lib/editor` (markdown, komendy, `EditorUi`, `BlockActions`) i reducer czatu.

| Warstwa / moduł | Pokrycie przed | Ryzyko braku testów |
|---|---|---|
| `shared/api` (axios: refresh 401, kolejka, CSRF, mapowanie błędów) | ~5–40% | **krytyczne**: sesja, bezpieczeństwo, każde żądanie |
| `entities/*` (klienci API, cache React Query) | 0–26% | wysokie: kontrakt z BE, spójność cache |
| `features/auth` (formularze, guardy tras) | 0% | wysokie: dostęp do danych |
| `features/ai-chat` (`useNoteChat`, storage, UI) | hook i UI 0% | wysokie: strumień SSE, przerwanie, błędy |
| `features/ai-settings` | 0% | średnie: obsługa sekretu (klucz API) |
| `features/manage-notes` (autosave, `[[`, podnotatki) | ~49% (hooki), UI 0% | **krytyczne**: utrata danych notatki |
| `features/note-search` | 0% | średnie |
| `shared/ui/RichEditor` (slash menu, `[[`, Ask AI, bubble menu) | tylko `RichEditorRoot` | wysokie: główna interakcja aplikacji |
| `widgets`, `pages`, `app/routes` | 0% | średnie: integracja, routing |

## 3. Wykaz braków (wynik audytu)

Priorytet: **P0** = bezpieczeństwo / utrata danych / sesja; **P1** = główne ścieżki użytkownika; **P2** = prezentacja.

| # | Prio | Obszar | Czego brakowało |
|---|---|---|---|
| 1 | P0 | `handle401Error` + `error.interceptor` | refresh i retry, brak pętli przy drugim 401, `_skipAuthRefresh`, 401 z `/auth/refresh`, wspólny refresh dla równoległych 401, odrzucenie kolejki przy nieudanym refreshu, mapowanie błędu na `ApiError` (status, komunikat, body, błąd sieci) |
| 2 | P0 | `csrf.interceptor` | token tylko dla metod modyfikujących, cache tokenu, odświeżenie przy 403, **złożenie z error interceptorem jak w aplikacji** |
| 3 | P0 | `RefreshQueueManager`, `normalizeError`, `isApiErrorResponseData` | brak testów |
| 4 | P0 | `useAutoSave`, `useNoteForm` | debounce, burst edycji, `forceCommit`, `markClean`, unmount, brak tytułu, zmiana tytułu |
| 5 | P0 | `NoteCreateWidget` / `NoteEditWidget` | tworzenie i zapis notatki end-to-end w komponencie, błędy zapisu, podnotatka z `parentId` |
| 6 | P0 | `features/auth` | `RequireAuth`, `RedirectIfAuth`, `ShowOnlyUser`, logowanie/rejestracja z nawigacją i błędem, „sesja wygasła” |
| 7 | P0 | `AuthApi.me` | `_skipAuthRefresh` (brak pętli refresh dla gościa) |
| 8 | P1 | `useNoteChat` | strumień, historia w żądaniu, przerwanie, odmontowanie, zerwane połączenie, błąd 403 → ustawienia, blokada drugiego wysłania |
| 9 | P1 | `chatStorage`, `toolActivityLabel`, gałęzie `toChatError` | storage niedostępny/uszkodzony, wznowienie po reloadzie |
| 10 | P1 | `AiChatApi` | parsowanie SSE, błąd JSON przychodzący jako stream, łączenie komunikatów walidacji, timeouty i `signal` |
| 11 | P1 | `entities/notes` | `updateNote` nie wysyła `id` w body, parametry wyszukiwania, aktualizacja cache po create/update, `enabled` w zapytaniach |
| 12 | P1 | `AiSettingsPanel` | wszystkie stany konta, walidacja długości sekretu, czyszczenie sekretu po zapisie, test połączenia, rozłączenie, status RAG |
| 13 | P1 | `NoteChat`, `ChatMessageItem` | Enter / Shift+Enter, Stop, Clear, źródła, kopiowanie, akcja „Open AI settings” |
| 14 | P1 | `useEditorIntegrations`, `useNestedNotePlugin`, `NestedNoteCreator` | wyszukiwanie `[[` z cache, ścieżka rodziców (limit 3, „Untitled”), pomijanie bieżącej notatki, tworzenie, Ask AI |
| 15 | P1 | Slash menu, picker `[[`, `AiPanel`, bubble menu | klawiatura, filtrowanie, Escape, bloki kodu, tworzenie notatki z pickera, akcje AI, anulowanie, wstawianie odpowiedzi, linki |
| 16 | P1 | `note-search` | debounce, filtry, stany ładowania/błędu/pusto, nawigacja |
| 17 | P1 | `AppRoutes`, `NoteEditPage`, `SidePanelWidget`, `NoteChatWidget` | routing gościa/użytkownika, tryb create/edit, wybór widoku czatu/ustawień |
| 18 | P2 | layouty, `AppAlert`, `WelcomeHero`, providery | czysta prezentacja — pokryte pośrednio przez testy stron |

## 4. Koncepcja uzupełnienia

**Zasady**

1. **Testujemy zachowanie widoczne dla użytkownika lub wywołującego**: tekst, role ARIA, wynikowy markdown, wywołanie API z konkretnym payloadem. Bez snapshotów i bez sprawdzania stanu wewnętrznego.
2. **Mock tylko na granicy systemu**: `vi.spyOn` na `NotesApi` / `AuthApi` / `AiChatApi` / `apiClient` albo testowy adapter axios. React Query, router, Chakra i Tiptap działają naprawdę. Każdy test ma świeży `QueryClient` (bez retry).
3. **Edytor testujemy na prawdziwym Tiptapie**: wpisywanie przez `handleTextInput`, klawisze przez `handleKeyDown`, a asercja na wyniku `getEditorMarkdown`.
4. **Znane defekty jako `it.fails`**: test opisuje oczekiwane zachowanie i dziś pada. Zestaw jest zielony, a defekt widoczny. Po naprawie `.fails` zaczyna failować i trzeba go usunąć. Każdy taki test był sprawdzony bez `.fails` i pada z właściwego powodu.
5. **Poza testami jednostkowymi świadomie zostaje** to, co wymaga layoutu przeglądarki (pozycjonowanie, drag & drop, `visualViewport`). Logika pod spodem jest pokryta, a reszta należy do E2E (§7).

**Infrastruktura (dodana)**

| Plik | Rola |
|---|---|
| `vite.config.ts` → `test.setupFiles`, `test.coverage` | setup + coverage v8 (`npm run test:coverage`, raport HTML w `coverage/`) |
| `src/shared/lib/test/setup.ts` | `jest-dom`, `cleanup` i czyszczenie `sessionStorage` po każdym teście, polyfille jsdom (`ResizeObserver`, `matchMedia`, `scrollIntoView`, `Range#getClientRects`) |
| `src/shared/lib/test/render.tsx` | `renderWithProviders`, `renderHookWithProviders` (Chakra + React Query + MemoryRouter), `LocationProbe` do asercji nawigacji |
| `src/shared/lib/test/axios.ts` | `createTestClient`: instancja axios z kontrolowanymi odpowiedziami (prawdziwe interceptory, bez sieci) |
| `src/shared/lib/test/editor.ts` | `typeText`, `press`, `select`, `editorOf`: sterowanie edytorem Tiptap |
| `src/shared/ui/RichEditor/editorTestHarness.tsx` | `renderEditor`: `RichEditor.Root` z dostępem do instancji edytora |

Nowe devDependencies (uzasadnienie): `@vitest/coverage-v8` (pomiar), `@testing-library/user-event` (realistyczne interakcje), `@testing-library/jest-dom` (czytelne asercje DOM).

## 5. Wynik

| Metryka | Przed | Po |
|---|---|---|
| Pliki testów | 10 | 37 |
| Testy | 129 | 418 (w tym 6 `it.fails` dla znanych defektów) |
| Instrukcje | 30,7% | **90,4%** |
| Gałęzie | 72,7% | **91,4%** |
| Funkcje | 46,1% | **86,2%** |
| Czas `vitest run` | ~2 s | ~11 s |

Weryfikacja: `vitest run` zielony 3× pod rząd (brak niestabilnych testów), `tsc -b` bez błędów, `eslint .` bez błędów i ostrzeżeń, Prettier na plikach testów czysty. Kod produkcyjny **nie był zmieniany**.

Wszystkie pozycje P0 i P1 z §3 są pokryte. Pliki testów:

| Obszar | Plik |
|---|---|
| HTTP / sesja | `shared/api/axios/interceptors/{error,csrf}.interceptor.test.ts`, `shared/api/axios/lib/RefreshQueueManager.test.ts`, `shared/api/lib/typeGuards.test.ts`, `shared/lib/error.test.ts` |
| Encje | `entities/notes/api/notesApi.test.ts`, `entities/notes/api/hooks/noteMutations.test.tsx`, `entities/session/api/session.api.test.ts`, `entities/ai-chat/api/aiChatApi.test.ts` |
| Auth | `features/auth/ui/authForms.test.tsx`, `features/auth/ui/authFlow.test.tsx` |
| Czat AI / ustawienia | `features/ai-chat/lib/chatLib.test.ts`, `features/ai-chat/model/useNoteChat.test.ts`, `features/ai-chat/ui/NoteChat.test.tsx`, `features/ai-settings/ui/AiSettingsPanel.test.tsx` |
| Notatki | `features/manage-notes/model/hooks/{useAutoSave,useNoteForm,useEditorIntegrations}.test.*`, `features/manage-notes/ui/manageNotesUi.test.tsx` |
| Wyszukiwanie | `features/note-search/noteSearch.test.tsx`, `shared/lib/hooks/useDebounce.test.ts` |
| Edytor UI | `shared/ui/RichEditor/{editorMenus,AiPanel,RichEditorBubbleMenu}.test.tsx` |
| Integracja | `pages/NoteEditPage/NoteEditPage.test.tsx`, `app/routes/AppRoutes.test.tsx`, `widgets/SidePanelWidget/sidePanel.test.tsx`, `widgets/NoteChatWidget/NoteChatWidget.test.tsx` |

## 6. Defekty znalezione podczas audytu

Nie były naprawiane, bo zakres zadania obejmował testy. Każdy z D1–D4, D6 i D8 ma test `it.fails`, który zacznie failować po naprawie.

| ID | Waga | Gdzie | Defekt i scenariusz awarii | Test |
|---|---|---|---|---|
| **D1** | wysoka | `app/init.ts` + `shared/api/axios/client.ts` | Ponowienie żądania przy 403 CSRF nigdy nie działa. `client.ts` przy imporcie rejestruje error interceptor, a `initApiConfig` rejestruje interceptor CSRF później. Odpowiedzi przechodzą interceptory w kolejności rejestracji, więc CSRF dostaje już `ApiError` bez `.response`. Skutek: gdy zapamiętany token CSRF się zdezaktualizuje, każda mutacja (zapis notatki!) kończy się 403 aż do przeładowania strony. | `csrf.interceptor.test.ts` › *composed like the app* |
| **D2** | wysoka (uśpiona) | `csrf.interceptor.ts` | Ponowienie przy 403 nie ma limitu ani nie sprawdza, czy 403 dotyczy CSRF. BE zwraca 403 również dla `AI_CREDENTIALS_REQUIRED`, więc po naprawie D1 każde 403 z `/ai/*` zapętli żądania. **Naprawiać razem z D1**: ponawiać raz (flaga w configu) i tylko dla błędu CSRF (`EBADCSRFTOKEN` / „invalid csrf token”). | `csrf.interceptor.test.ts` › *at most once* |
| **D3** | niska | `note-search/config/constants.ts` | Odwrócone etykiety sortowania: BE sortuje `title` rosnąco (A→Z), a UI pokazuje „Title Z-A” (i odwrotnie dla `-title`). Do sprawdzenia przy okazji po stronie BE: `rank` = `_relevance asc`, czyli domyślnie najmniej trafne wyniki pierwsze. | `noteSearch.test.tsx` › *title order* |
| **D4** | **wysoka (dane)** | `NoteCreateWidget` | Na stronie „Create Note” każdy autosave to nowy `POST /notes`. Jeśli użytkownik pisze dalej, zanim pierwsze żądanie wróci, powstają **duplikaty notatek** (potwierdzone: `"A"` i `"AB"` → 2 notatki). | `NoteEditPage.test.tsx` › *creates the note only once* |
| **D5** | średnia | `DeleteNoteAction` | Przycisk „Delete note” jest widoczny na stronie notatki, ale tylko loguje do konsoli. Użytkownik może sądzić, że usunął notatkę. | brak (`manageNotesUi.test.tsx` sprawdza tylko render) |
| **D6** | niska | `widgets/SidePanelWidget/config/navigaton.ts` | Link „Settings” prowadzi do `/settings`, a takiej trasy nie ma (pusta strona). | `AppRoutes.test.tsx` › *every link in the side panel* |
| **D7** | niska (a11y) | `LoginForm`, `RegisterForm` | Przycisk pokaż/ukryj hasło nie ma `aria-label`, więc czytnik ekranu odczyta pusty przycisk. | `authForms.test.tsx` (helper `passwordToggle`) |
| **D8** | wysoka (UX) | `NoteEditPage` / `AppRoutes` | Brak error boundary. Błąd ładowania notatki (usunięta notatka → 404, brak sieci) rzucany przez `useSuspenseQuery` odmontowuje **całą aplikację** (biały ekran). | `NoteEditPage.test.tsx` › *instead of a blank page* |
| D9 | info | różne | Martwy kod: `SidePanelError` nieużywany. `AuthApi.logout` nie jest nigdzie wywoływane, więc w UI nie ma wylogowania. | — |

## 7. Co zostaje poza testami jednostkowymi

| Element | Pokrycie | Dlaczego | Rekomendacja |
|---|---|---|---|
| `RichEditorBlockHandle` (uchwyt bloku, drag & drop) | ~50% | wymaga współrzędnych myszy i `posAtCoords`, których jsdom nie liczy; komendy pod spodem testuje `BlockActions.test.ts` | E2E (Playwright) |
| `RichEditorMobileToolbar` | ~15% | zależy od `pointer: coarse` i `visualViewport` | E2E na emulacji mobilnej; ewentualnie test jednostkowy z `matchMedia` → coarse |
| `app/providers/*`, `app/init.ts`, `main.tsx` | 0% | composition root: konfiguracja bibliotek bez logiki; kolejność interceptorów jest pokryta testem D1 | smoke E2E |
| `SidePanel` (layout) | 85% | `SidePanelFooter` nieużywany | — |

## 8. Następne kroki

1. Naprawić D4, D8, D1+D2 (w tej kolejności: dane → dostępność aplikacji → sesja), za każdym razem usuwając odpowiadające `.fails`.
2. Zdecydować o D5 (ukryć przycisk albo dokończyć usuwanie) i D6.
3. Podpiąć `vitest run` do CI FE (KONCEPCJA, faza 1). Próg coverage jako ratchet: na start `statements: 90`, nie wyżej, żeby nie zachęcać do pustych testów.
4. Dodać E2E (Playwright) dla elementów z §7 i dla jednej pełnej ścieżki: logowanie → nowa notatka → `[[` link → czat AI.

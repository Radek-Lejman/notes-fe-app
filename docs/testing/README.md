# Testy FE — co nie jest pokryte i dlaczego

Stan: 2026-10-11 · 37 plików, 418 testów · pokrycie: **90,4% instrukcji · 91,4% gałęzi · 86,2% funkcji**

Pełny audyt (wymagania, koncepcja, znalezione defekty): [unit-test-audit.md](./unit-test-audit.md).

## Uruchamianie

```bash
npm test                # vitest run (~11 s)
npm run test:watch
npm run test:coverage   # podsumowanie w konsoli + raport HTML w coverage/index.html
```

Infrastruktura testowa: `src/shared/lib/test/` (setup, render z providerami, testowy klient axios, sterowanie edytorem) i `src/shared/ui/RichEditor/editorTestHarness.tsx`.

## Zasada

Celem nie jest 100%. Pokrycie mierzy wykonane linie, a nie sprawdzone zachowanie, a ostatnie procenty zwykle dobija się testami bez wartości (zob. `KONCEPCJA.md` §4). Niepokryte miejsca należą do jednej z kategorii poniżej, każda z decyzją, co z nią robić.

| Kategoria | Decyzja |
|---|---|
| A. Wymaga prawdziwej przeglądarki | testy E2E (Playwright), nie unit |
| B. Konfiguracja aplikacji (composition root) | bez testów jednostkowych |
| C. Martwy lub niedokończony kod | usunąć albo dokończyć, nie testować |
| D. Gałęzie obronne | świadomie bez testów |
| E. Realna logika bez testu | **kandydaci do uzupełnienia** |

## A. Wymaga prawdziwej przeglądarki → E2E

jsdom nie liczy układu strony: elementy nie mają rozmiarów ani pozycji, nie ma `posAtCoords`, `visualViewport` ani prawdziwego drag & drop. Test jednostkowy musiałby to wszystko podmienić i sprawdzałby wtedy własne podmiany, a nie aplikację.

| Plik | Pokrycie | Co nie jest pokryte | Co jest pokryte gdzie indziej |
|---|---|---|---|
| `shared/ui/RichEditor/RichEditorBlockHandle.tsx` | 50% | śledzenie bloku pod kursorem myszy, pozycja uchwytu, przeciąganie bloków, menu uchwytu | komendy, które menu wywołuje (przesuwanie, duplikowanie, usuwanie, wstawianie bloku): `BlockActions.test.ts` |
| `shared/ui/RichEditor/RichEditorMobileToolbar.tsx` | 15% | pasek nad klawiaturą ekranową: widoczny tylko przy `pointer: coarse`, położenie liczone z `visualViewport` | komendy formatowania i bloków: `commands.test.ts`, `RichEditorBubbleMenu.test.tsx` |

**Do zrobienia:** E2E dla przeciągania bloków i menu uchwytu (desktop) oraz dla paska na emulacji telefonu. Pasek mobilny da się ewentualnie przetestować jednostkowo z `matchMedia('(pointer: coarse)')` → `true`, ale sprawdziłoby to tylko podpięcie przycisków.

## B. Konfiguracja aplikacji (composition root)

| Plik | Pokrycie | Dlaczego bez testów |
|---|---|---|
| `app/providers/**` (Chakra, kolory, toaster, tooltip, React Query) | 0% | tylko konfiguracja bibliotek, bez własnej logiki; testy używają tych samych providerów przez `renderWithProviders` |
| `app/init.ts` | 0% | rejestruje interceptor CSRF; **kolejność interceptorów, czyli jedyną istotną rzecz w tym pliku, sprawdza test defektu D1** w `csrf.interceptor.test.ts` |
| `main.tsx` | wyłączony z pomiaru | punkt wejścia (montowanie Reacta) |

Właściwe miejsce na sprawdzenie, że aplikacja startuje, to jeden smoke test E2E.

## C. Martwy lub niedokończony kod

Testowanie tych miejsc utrwaliłoby kod, który powinien zniknąć albo zostać dokończony.

| Plik / linie | Stan | Decyzja |
|---|---|---|
| `widgets/SidePanelWidget/ui/SidePanelSectionError/SidePanelSectionError.tsx` | nigdzie nieużywany | usunąć |
| `shared/ui/layouts/SidePanel/SidePanel.tsx` 76–90 (`SidePanelFooter`) | nigdzie nieużywany | usunąć albo użyć (np. na wylogowanie, którego w UI brakuje) |
| `features/manage-notes/ui/DeleteNoteAction/DeleteNoteAction.tsx` 10–11 | przycisk tylko loguje do konsoli (defekt **D5**) | dokończyć usuwanie albo ukryć przycisk; test powstanie razem z funkcją |
| `pages/WelcomePage/ui/WelcomeHero.tsx` 14 | prop `username` nigdy nie jest przekazywany | przekazać e-mail z sesji albo usunąć prop |
| `shared/ui/AppAlert/AppAlert.tsx` 15 | prop `title` nigdy nie jest używany | zostawić (komponent bazowy) albo usunąć |

## D. Gałęzie obronne — świadomie bez testów

Zabezpieczenia na sytuacje, które przy obecnym kodzie nie występują. Test wymagałby sztucznego zepsucia konfiguracji, a nie sprawdzałby zachowania widocznego dla użytkownika.

| Plik / linie | Gałąź | Dlaczego nie występuje |
|---|---|---|
| `shared/lib/editor/ai.ts` (gałęzie 49, 54–57, 78–79) | wyjątek, gdy edytor nie ma rozszerzenia Markdown; puste `content` po parsowaniu | `RichEditorRoot` zawsze rejestruje Markdown |
| `shared/lib/editor/extensions/BlockActions.ts` (gałęzie ~105–123) | `return false`, gdy w schemacie nie ma `paragraph` lub `createAndFill` zwróci `null` | schemat edytora zawsze ma te węzły |
| `shared/api/axios/interceptors/error.interceptor.ts` 21–22 | komunikat `'Unknown API error'` | axios zawsze ustawia `error.message` |
| `widgets/SidePanelWidget/model/useSidePanelLogic.ts` 11 | `notes.data \|\| []` | `useSuspenseQuery` gwarantuje dane |
| `features/note-search/ui/NoteSearchFilters.tsx` 18, 37, 56 | `\|\| DEFAULT_SEARCH_FILTERS.*` | filtry zawsze startują od wartości domyślnych |
| `features/manage-notes/lib/tiptap/PageReferenceNodeView.tsx` 36 | tytuł `'Untitled Page'` | markdown zawsze daje tytuł; fallback „Untitled” przy zapisie testuje `markdown.test.ts` |
| `widgets/NoteEditorWidget/ui/NoteCreateWidget.tsx` 28 | komunikat `'Server connection error'` przy pustym `error.message` | `ApiError` zawsze ma komunikat |

## E. Realna logika bez testu — kandydaci do uzupełnienia

Tanie do dopisania i sprawdzają rzeczy, które użytkownik zauważy. Rekomendacja: dopisać przy najbliższej zmianie w danym pliku.

| Plik / linie | Co nie jest sprawdzone | Jak przetestować |
|---|---|---|
| `shared/ui/RichEditor/NoteLink/NoteLinkList.tsx` 24–30, 36 | nawigacja strzałkami w pickerze `[[` (zawijanie listy, nieobsłużony klawisz) | jak w `editorMenus.test.tsx` › slash menu › *arrow keys*, tylko z `[[` |
| `shared/lib/editor/link.ts` 34–36 | zatwierdzenie pustego adresu w edytorze linku usuwa link | `RichEditorBubbleMenu.test.tsx`: Mod+K na linku, wyczyść pole, Enter |
| `shared/api/axios/client.ts` 17–18 | po nieudanym odświeżeniu sesji czyszczony jest cache React Query (dane poprzedniego użytkownika nie zostają w pamięci) | podmienić adapter `apiClient` w teście, wymusić 401 z `/auth/refresh` i sprawdzić, że `queryClient` jest pusty |
| `widgets/NoteEditorWidget/ui/NoteEditWidget.tsx` 32–33 | kliknięcie odnośnika do podnotatki otwiera ją w aplikacji | `NoteEditPage.test.tsx`: kliknąć przycisk podnotatki i sprawdzić ścieżkę przez `LocationProbe` |

Najważniejsza pozycja to `client.ts`: dotyczy danych użytkownika po wygaśnięciu sesji.

## Testy znanych defektów (`it.fails`)

Sześć testów opisuje **poprawne** zachowanie i dziś pada, bo w aplikacji jest błąd. Są oznaczone `it.fails`, więc zestaw jest zielony, a błąd widoczny. Po naprawie test zacznie failować; wtedy usuń `.fails`.

| Defekt | Test |
|---|---|
| D1: ponawianie po 403 CSRF nigdy nie działa | `shared/api/axios/interceptors/csrf.interceptor.test.ts` |
| D2: ponawianie po 403 bez limitu (pętla) | jw. |
| D3: odwrócone etykiety sortowania po tytule | `features/note-search/noteSearch.test.tsx` |
| D4: duplikaty notatek przy tworzeniu | `pages/NoteEditPage/NoteEditPage.test.tsx` |
| D6: link „Settings” bez trasy | `app/routes/AppRoutes.test.tsx` |
| D8: biały ekran przy błędzie ładowania notatki | `pages/NoteEditPage/NoteEditPage.test.tsx` |

## Znane zachowanie zestawu

- **Przeciążona maszyna:** przy bardzo dużym obciążeniu CPU vitest może zgłosić `Timeout calling "onTaskUpdate"`, zwykle przy teście D8, który celowo wywołuje crash aplikacji. To nie jest niestabilność testów: przy normalnym obciążeniu zestaw przechodzi stabilnie (sprawdzone wielokrotnie, ~11 s). Jeśli się zdarzy, powtórz przebieg.
- **Fokus edytora:** edytor ustawia fokus na sobie asynchronicznie po zamontowaniu. Testy, które wpisują tytuł, najpierw czekają na fokus edytora (`editorFocused()`), inaczej tekst trafiłby do treści notatki.

## Aktualizacja tego pliku

Po większej zmianie uruchom `npm run test:coverage` i porównaj z tabelami powyżej. Każde nowe miejsce poniżej ~90% przypisz do kategorii A–E. Jeśli nie pasuje do żadnej, to po prostu brakuje testu.

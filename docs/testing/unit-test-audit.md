# FE unit test audit

Status: done · 2026-10-11 · scope: `notes-app-fe/src` (vitest + Testing Library, jsdom)

## 1. Requirements audited against

| Source                                                        | Requirement                                                                                                                                        |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notes-app-be/docs/ai-dev-system/CONCEPT.md` §4               | Unit tests (vitest) cover: utils, mappers, services, **FE hooks and components**                                                                   |
| CONCEPT §4                                                    | No hard coverage threshold at the start; test quality matters more than the percentage (a test must really assert behaviour, not "does not throw") |
| CONCEPT §1 item 1, §3                                         | The result is verified by deterministic tools: `vitest run`, `tsc -b`, `eslint`, `prettier --check` must be green                                  |
| `.agents/rules/review.md`                                     | Edge cases, not just the happy path; tests of behaviour, not implementation; no "tests that test nothing"; no silent catches                       |
| `.agents/rules/fsd_architecture.md` + ESLint `feature-sliced` | Tests and helpers respect the FSD layers (no upward imports, relative paths within a layer)                                                        |

## 2. Starting point (measured)

- 10 test files, 129 tests, all green.
- No coverage tool, no setup file, no helpers (each test assembled its own providers).
- Coverage (the same configuration as in §5): **30.7% statements · 46.1% functions**.
- Only the editor core was well covered: `shared/lib/editor` (markdown, commands, `EditorUi`, `BlockActions`) and the chat reducer.

| Layer / module                                                 | Coverage before       | Risk of missing tests                             |
| -------------------------------------------------------------- | --------------------- | ------------------------------------------------- |
| `shared/api` (axios: 401 refresh, queue, CSRF, error mapping)  | ~5–40%                | **critical**: session, security, every request    |
| `entities/*` (API clients, React Query cache)                  | 0–26%                 | high: the contract with the BE, cache consistency |
| `features/auth` (forms, route guards)                          | 0%                    | high: access to data                              |
| `features/ai-chat` (`useNoteChat`, storage, UI)                | hook and UI 0%        | high: SSE stream, abort, errors                   |
| `features/ai-settings`                                         | 0%                    | medium: handling a secret (API key)               |
| `features/manage-notes` (autosave, `[[`, sub-notes)            | ~49% (hooks), UI 0%   | **critical**: losing note data                    |
| `features/note-search`                                         | 0%                    | medium                                            |
| `shared/ui/RichEditor` (slash menu, `[[`, Ask AI, bubble menu) | only `RichEditorRoot` | high: the app's main interaction                  |
| `widgets`, `pages`, `app/routes`                               | 0%                    | medium: integration, routing                      |

## 3. List of gaps (audit result)

Priority: **P0** = security / data loss / session; **P1** = main user paths; **P2** = presentation.

| #   | Prio | Area                                                                | What was missing                                                                                                                                                                                                                                |
| --- | ---- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | P0   | `handle401Error` + `error.interceptor`                              | refresh and retry, no loop on a second 401, `_skipAuthRefresh`, a 401 from `/auth/refresh`, a shared refresh for parallel 401s, rejecting the queue on a failed refresh, mapping the error to `ApiError` (status, message, body, network error) |
| 2   | P0   | `csrf.interceptor`                                                  | token only for mutating methods, token cache, refresh on 403, **composition with the error interceptor as in the app**                                                                                                                          |
| 3   | P0   | `RefreshQueueManager`, `normalizeError`, `isApiErrorResponseData`   | no tests                                                                                                                                                                                                                                        |
| 4   | P0   | `useAutoSave`, `useNoteForm`                                        | debounce, an edit burst, `forceCommit`, `markClean`, unmount, no title, title change                                                                                                                                                            |
| 5   | P0   | `NoteCreateWidget` / `NoteEditWidget`                               | creating and saving a note end-to-end in the component, save errors, a sub-note with `parentId`                                                                                                                                                 |
| 6   | P0   | `features/auth`                                                     | `RequireAuth`, `RedirectIfAuth`, `ShowOnlyUser`, login/registration with navigation and errors, "session expired"                                                                                                                               |
| 7   | P0   | `AuthApi.me`                                                        | `_skipAuthRefresh` (no refresh loop for a guest)                                                                                                                                                                                                |
| 8   | P1   | `useNoteChat`                                                       | stream, history in the request, abort, unmount, a dropped connection, a 403 error → settings, blocking a second send                                                                                                                            |
| 9   | P1   | `chatStorage`, `toolActivityLabel`, `toChatError` branches          | storage unavailable/corrupted, resuming after a reload                                                                                                                                                                                          |
| 10  | P1   | `AiChatApi`                                                         | SSE parsing, a JSON error arriving as a stream, joining validation messages, timeouts and `signal`                                                                                                                                              |
| 11  | P1   | `entities/notes`                                                    | `updateNote` does not send `id` in the body, search parameters, cache update after create/update, `enabled` in queries                                                                                                                          |
| 12  | P1   | `AiSettingsPanel`                                                   | all account states, secret length validation, clearing the secret after saving, connection test, disconnect, RAG status                                                                                                                         |
| 13  | P1   | `NoteChat`, `ChatMessageItem`                                       | Enter / Shift+Enter, Stop, Clear, sources, copying, the "Open AI settings" action                                                                                                                                                               |
| 14  | P1   | `useEditorIntegrations`, `useNestedNotePlugin`, `NestedNoteCreator` | `[[` search from the cache, the parent path (limit 3, "Untitled"), skipping the current note, creation, Ask AI                                                                                                                                  |
| 15  | P1   | Slash menu, `[[` picker, `AiPanel`, bubble menu                     | keyboard, filtering, Escape, code blocks, creating a note from the picker, AI actions, cancelling, inserting the answer, links                                                                                                                  |
| 16  | P1   | `note-search`                                                       | debounce, filters, loading/error/empty states, navigation                                                                                                                                                                                       |
| 17  | P1   | `AppRoutes`, `NoteEditPage`, `SidePanelWidget`, `NoteChatWidget`    | guest/user routing, create/edit mode, choosing the chat/settings view                                                                                                                                                                           |
| 18  | P2   | layouts, `AppAlert`, `WelcomeHero`, providers                       | pure presentation — covered indirectly by page tests                                                                                                                                                                                            |

## 4. Plan for filling the gaps

**Rules**

1. **Test behaviour visible to the user or caller**: text, ARIA roles, the resulting markdown, an API call with a specific payload. No snapshots and no checking internal state.
2. **Mock only at the system boundary**: `vi.spyOn` on `NotesApi` / `AuthApi` / `AiChatApi` / `apiClient` or a test axios adapter. React Query, the router, Chakra and Tiptap run for real. Every test has a fresh `QueryClient` (no retry).
3. **The editor is tested on real Tiptap**: typing via `handleTextInput`, keys via `handleKeyDown`, and assertions on the result of `getEditorMarkdown`.
4. **Known defects as `it.fails`**: the test describes the expected behaviour and fails today. The suite is green and the defect visible. After the fix `.fails` starts failing and has to be removed. Each such test was checked without `.fails` and fails for the right reason.
5. **Deliberately left outside unit tests**: whatever needs browser layout (positioning, drag & drop, `visualViewport`). The logic underneath is covered, the rest belongs to E2E (§7).

**Infrastructure (added)**

| File                                                  | Role                                                                                                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts` → `test.setupFiles`, `test.coverage` | setup + v8 coverage (`npm run test:coverage`, HTML report in `coverage/`)                                                                                        |
| `src/shared/lib/test/setup.ts`                        | `jest-dom`, `cleanup` and clearing `sessionStorage` after every test, jsdom polyfills (`ResizeObserver`, `matchMedia`, `scrollIntoView`, `Range#getClientRects`) |
| `src/shared/lib/test/render.tsx`                      | `renderWithProviders`, `renderHookWithProviders` (Chakra + React Query + MemoryRouter), `LocationProbe` for navigation assertions                                |
| `src/shared/lib/test/axios.ts`                        | `createTestClient`: an axios instance with controlled responses (real interceptors, no network)                                                                  |
| `src/shared/lib/test/editor.ts`                       | `typeText`, `press`, `select`, `editorOf`: driving the Tiptap editor                                                                                             |
| `src/shared/ui/RichEditor/editorTestHarness.tsx`      | `renderEditor`: `RichEditor.Root` with access to the editor instance                                                                                             |

New devDependencies (reason): `@vitest/coverage-v8` (measurement), `@testing-library/user-event` (realistic interactions), `@testing-library/jest-dom` (readable DOM assertions).

## 5. Result

| Metric            | Before | After                                          |
| ----------------- | ------ | ---------------------------------------------- |
| Test files        | 10     | 37                                             |
| Tests             | 129    | 418 (including 6 `it.fails` for known defects) |
| Statements        | 30.7%  | **90.4%**                                      |
| Branches          | 72.7%  | **91.4%**                                      |
| Functions         | 46.1%  | **86.2%**                                      |
| `vitest run` time | ~2 s   | ~11 s                                          |

Verification: `vitest run` green 3× in a row (no flaky tests), `tsc -b` without errors, `eslint .` without errors and warnings, Prettier clean on the test files. Production code **was not changed**.

All P0 and P1 items from §3 are covered. Test files:

| Area               | File                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP / session     | `shared/api/axios/interceptors/{error,csrf}.interceptor.test.ts`, `shared/api/axios/lib/RefreshQueueManager.test.ts`, `shared/api/lib/typeGuards.test.ts`, `shared/lib/error.test.ts` |
| Entities           | `entities/notes/api/notesApi.test.ts`, `entities/notes/api/hooks/noteMutations.test.tsx`, `entities/session/api/session.api.test.ts`, `entities/ai-chat/api/aiChatApi.test.ts`        |
| Auth               | `features/auth/ui/authForms.test.tsx`, `features/auth/ui/authFlow.test.tsx`                                                                                                           |
| AI chat / settings | `features/ai-chat/lib/chatLib.test.ts`, `features/ai-chat/model/useNoteChat.test.ts`, `features/ai-chat/ui/NoteChat.test.tsx`, `features/ai-settings/ui/AiSettingsPanel.test.tsx`     |
| Notes              | `features/manage-notes/model/hooks/{useAutoSave,useNoteForm,useEditorIntegrations}.test.*`, `features/manage-notes/ui/manageNotesUi.test.tsx`                                         |
| Search             | `features/note-search/noteSearch.test.tsx`, `shared/lib/hooks/useDebounce.test.ts`                                                                                                    |
| Editor UI          | `shared/ui/RichEditor/{editorMenus,AiPanel,RichEditorBubbleMenu}.test.tsx`                                                                                                            |
| Integration        | `pages/NoteEditPage/NoteEditPage.test.tsx`, `app/routes/AppRoutes.test.tsx`, `widgets/SidePanelWidget/sidePanel.test.tsx`, `widgets/NoteChatWidget/NoteChatWidget.test.tsx`           |

## 6. Defects found during the audit

They were not fixed, because the task covered tests. Each of D1–D4, D6 and D8 has an `it.fails` test that starts failing after the fix.

| ID                             | Severity        | Where                                         | Defect and failure scenario                                                                                                                                                                                                                                                                                                                                                                                                | Test                                                                          |
| ------------------------------ | --------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ~~**D1**~~ ✅ fixed 2026-10-23 | high            | `app/init.ts` + `shared/api/axios/client.ts`  | Retrying a request after a CSRF 403 never works. `client.ts` registers the error interceptor at import time, and `initApiConfig` registers the CSRF interceptor later. Responses go through interceptors in registration order, so the CSRF one already gets an `ApiError` without `.response`. Result: once the cached CSRF token goes stale, every mutation (saving a note!) ends with a 403 until the page is reloaded. | `csrf.interceptor.test.ts` › _composed like the app_                          |
| ~~**D2**~~ ✅ fixed 2026-10-23 | high (dormant)  | `csrf.interceptor.ts`                         | Retrying on a 403 has no limit and does not check whether the 403 is about CSRF. The BE also returns 403 for `AI_CREDENTIALS_REQUIRED`, so after fixing D1 every 403 from `/ai/*` would loop the requests. **Fix together with D1**: retry once (a flag in the config) and only for a CSRF error (`EBADCSRFTOKEN` / "invalid csrf token").                                                                                 | `csrf.interceptor.test.ts` › _at most once_                                   |
| ~~**D3**~~ ✅ fixed 2026-10-23 | low             | `note-search/config/constants.ts`             | Inverted sort labels: the BE sorts `title` ascending (A→Z), while the UI shows "Title Z-A" (and the reverse for `-title`). To check on the BE side as well: `rank` = `_relevance asc`, i.e. the least relevant results first by default.                                                                                                                                                                                   | `noteSearch.test.tsx` › _title order_                                         |
| ~~**D4**~~ ✅ fixed 2026-10-23 | **high (data)** | `NoteCreateWidget`                            | On the "Create Note" page every autosave is a new `POST /notes`. If the user keeps typing before the first request returns, **duplicate notes** are created (confirmed: `"A"` and `"AB"` → 2 notes).                                                                                                                                                                                                                       | `NoteEditPage.test.tsx` › _creates the note only once_                        |
| **D5**                         | medium          | `DeleteNoteAction`                            | The "Delete note" button is visible on the note page, but it only logs to the console. The user may think they deleted the note.                                                                                                                                                                                                                                                                                           | none (`manageNotesUi.test.tsx` only checks rendering)                         |
| ~~**D6**~~ ✅ fixed 2026-10-23 | low             | `widgets/SidePanelWidget/config/navigaton.ts` | The "Settings" link goes to `/settings`, and there is no such route (an empty page).                                                                                                                                                                                                                                                                                                                                       | `AppRoutes.test.tsx` › _every link in the side panel_                         |
| **D7**                         | low (a11y)      | `LoginForm`, `RegisterForm`                   | The show/hide password button has no `aria-label`, so a screen reader announces an empty button.                                                                                                                                                                                                                                                                                                                           | `authForms.test.tsx` (the `passwordToggle` helper)                            |
| ~~**D8**~~ ✅ fixed 2026-10-12 | high (UX)       | `NoteEditPage` / `AppRoutes`                  | No error boundary. A note loading error (deleted note → 404, no network) thrown by `useSuspenseQuery` unmounts **the whole app** (a blank screen).                                                                                                                                                                                                                                                                         | `NoteEditPage.test.tsx` › _instead of a blank page_, _Try again_ (plain `it`) |
| D9                             | info            | various                                       | Dead code: `SidePanelError` unused. `AuthApi.logout` is called nowhere, so the UI has no logout.                                                                                                                                                                                                                                                                                                                           | —                                                                             |

## 7. What stays outside unit tests

| Item                                                | Coverage | Why                                                                                                                                   | Recommendation                                                           |
| --------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `RichEditorBlockHandle` (block handle, drag & drop) | ~50%     | needs mouse coordinates and `posAtCoords`, which jsdom does not compute; the commands underneath are tested by `BlockActions.test.ts` | E2E (Playwright)                                                         |
| `RichEditorMobileToolbar`                           | ~15%     | depends on `pointer: coarse` and `visualViewport`                                                                                     | E2E on mobile emulation; possibly a unit test with `matchMedia` → coarse |
| `app/providers/*`, `app/init.ts`, `main.tsx`        | 0%       | composition root: library configuration without logic; the interceptor order is covered by the D1 test                                | E2E smoke                                                                |
| `SidePanel` (layout)                                | 85%      | `SidePanelFooter` unused                                                                                                              | —                                                                        |

## 8. Next steps

1. Fix D4, D8, D1+D2 (in this order: data → app availability → session), removing the corresponding `.fails` each time.
2. Decide on D5 (hide the button or finish deletion) and D6.
3. Hook `vitest run` into the FE CI (CONCEPT, phase 1). A coverage threshold as a ratchet: `statements: 90` to start, not higher, so as not to encourage empty tests.
4. Add E2E (Playwright) for the items in §7 and for one full path: login → new note → `[[` link → AI chat.

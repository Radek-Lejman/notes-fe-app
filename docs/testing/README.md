# FE tests — what is not covered and why

State: 2026-10-11 · 37 files, 418 tests · coverage: **90.4% statements · 91.4% branches · 86.2% functions**

Full audit (requirements, approach, defects found): [unit-test-audit.md](./unit-test-audit.md).

## Running

```bash
npm test                # vitest run (~11 s)
npm run test:watch
npm run test:coverage   # summary in the console + HTML report in coverage/index.html
```

Test infrastructure: `src/shared/lib/test/` (setup, render with providers, a test axios client, editor control) and `src/shared/ui/RichEditor/editorTestHarness.tsx`.

## Principle

The goal is not 100%. Coverage measures executed lines, not checked behaviour, and the last percent is usually reached with worthless tests (see `notes-app-be/docs/ai-dev-system/CONCEPT.md` §4). Uncovered spots belong to one of the categories below, each with a decision on what to do with it.

| Category                                | Decision                            |
| --------------------------------------- | ----------------------------------- |
| A. Needs a real browser                 | E2E tests (Playwright), not unit    |
| B. App configuration (composition root) | no unit tests                       |
| C. Dead or unfinished code              | delete or finish it, do not test it |
| D. Defensive branches                   | deliberately untested               |
| E. Real logic without a test            | **candidates to add**               |

## A. Needs a real browser → E2E

jsdom does not compute layout: elements have no sizes or positions, there is no `posAtCoords`, `visualViewport` or real drag & drop. A unit test would have to replace all of that and would then test its own replacements, not the app.

| File                                               | Coverage | What is not covered                                                                                                | What is covered elsewhere                                                                   |
| -------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `shared/ui/RichEditor/RichEditorBlockHandle.tsx`   | 50%      | tracking the block under the mouse cursor, the handle position, dragging blocks, the handle menu                   | the commands the menu calls (move, duplicate, delete, insert block): `BlockActions.test.ts` |
| `shared/ui/RichEditor/RichEditorMobileToolbar.tsx` | 15%      | the bar above the on-screen keyboard: visible only with `pointer: coarse`, position computed from `visualViewport` | formatting and block commands: `commands.test.ts`, `RichEditorBubbleMenu.test.tsx`          |

**To do:** E2E for dragging blocks and the handle menu (desktop) and for the bar on phone emulation. The mobile bar could be unit-tested with `matchMedia('(pointer: coarse)')` → `true`, but that would only check the button wiring.

## B. App configuration (composition root)

| File                                                                | Coverage                  | Why no tests                                                                                                                                                                                                       |
| ------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/providers/**` (Chakra, colours, toaster, tooltip, React Query) | 0%                        | library configuration only, no own logic; tests use the same providers via `renderWithProviders`                                                                                                                   |
| `app/init.ts`                                                       | 0%                        | registers the CSRF interceptor; **the interceptor order, the only thing that matters in this file, is checked by the D1 defect test** (the CSRF interceptor works with either order) in `csrf.interceptor.test.ts` |
| `main.tsx`                                                          | excluded from measurement | the entry point (mounting React)                                                                                                                                                                                   |

The right place to check that the app starts is a single E2E smoke test.

## C. Dead or unfinished code

Testing these spots would cement code that should disappear or be finished.

| File / lines                                                                 | State                                               | Decision                                                            |
| ---------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------- |
| `widgets/SidePanelWidget/ui/SidePanelSectionError/SidePanelSectionError.tsx` | used nowhere                                        | delete                                                              |
| `shared/ui/layouts/SidePanel/SidePanel.tsx` 76–90 (`SidePanelFooter`)        | used nowhere                                        | delete or use it (e.g. for logout, which the UI lacks)              |
| `features/manage-notes/ui/DeleteNoteAction/DeleteNoteAction.tsx` 10–11       | the button only logs to the console (defect **D5**) | finish deletion or hide the button; the test comes with the feature |
| `pages/WelcomePage/ui/WelcomeHero.tsx` 14                                    | the `username` prop is never passed                 | pass the email from the session or remove the prop                  |
| `shared/ui/AppAlert/AppAlert.tsx` 15                                         | the `title` prop is never used                      | keep it (a base component) or remove it                             |

## D. Defensive branches — deliberately untested

Safeguards for situations that do not occur with the current code. A test would require artificially breaking the configuration and would not check behaviour visible to the user.

| File / lines                                                       | Branch                                                                                | Why it does not occur                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `shared/lib/editor/ai.ts` (branches 49, 54–57, 78–79)              | an exception when the editor has no Markdown extension; empty `content` after parsing | `RichEditorRoot` always registers Markdown                                                        |
| `shared/lib/editor/extensions/BlockActions.ts` (branches ~105–123) | `return false` when the schema has no `paragraph` or `createAndFill` returns `null`   | the editor schema always has these nodes                                                          |
| `shared/api/axios/interceptors/error.interceptor.ts` 21–22         | the `'Unknown API error'` message                                                     | axios always sets `error.message`                                                                 |
| `widgets/SidePanelWidget/model/useSidePanelLogic.ts` 11            | `notes.data \|\| []`                                                                  | `useSuspenseQuery` guarantees data                                                                |
| `features/note-search/ui/NoteSearchFilters.tsx` 18, 37, 56         | `\|\| DEFAULT_SEARCH_FILTERS.*`                                                       | filters always start from the defaults                                                            |
| `features/manage-notes/lib/tiptap/PageReferenceNodeView.tsx` 36    | the `'Untitled Page'` title                                                           | markdown always provides a title; the "Untitled" fallback on save is tested by `markdown.test.ts` |
| `widgets/NoteEditorWidget/ui/NoteCreateWidget.tsx` 28              | the `'Server connection error'` message for an empty `error.message`                  | `ApiError` always has a message                                                                   |

## E. Real logic without a test — candidates to add

Cheap to add and they check things the user will notice. Recommendation: add them with the next change in the given file.

| File / lines                                               | What is not checked                                                                                                | How to test                                                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `shared/ui/RichEditor/NoteLink/NoteLinkList.tsx` 24–30, 36 | arrow-key navigation in the `[[` picker (list wrapping, an unhandled key)                                          | as in `editorMenus.test.tsx` › slash menu › _arrow keys_, only with `[[`                                          |
| `shared/lib/editor/link.ts` 34–36                          | confirming an empty address in the link editor removes the link                                                    | `RichEditorBubbleMenu.test.tsx`: Mod+K on a link, clear the field, Enter                                          |
| `shared/api/axios/client.ts` 17–18                         | after a failed session refresh the React Query cache is cleared (the previous user's data does not stay in memory) | replace the `apiClient` adapter in a test, force a 401 from `/auth/refresh` and check that `queryClient` is empty |
| `widgets/NoteEditorWidget/ui/NoteEditWidget.tsx` 32–33     | clicking a link to a sub-note opens it in the app                                                                  | `NoteEditPage.test.tsx`: click the sub-note button and check the path via `LocationProbe`                         |

The most important item is `client.ts`: it concerns user data after the session expires.

## Known-defect tests (`it.fails`)

An `it.fails` test describes the **correct** behaviour and fails today because of a bug in the app. The suite is green and the bug is visible. After the fix the test starts failing; then remove `.fails`.

There are currently no open defects with an `it.fails` test. Fixed (plain `it` today):

| Defect                                            | Test                                                     |
| ------------------------------------------------- | -------------------------------------------------------- |
| D1: retrying after a CSRF 403 never worked        | `shared/api/axios/interceptors/csrf.interceptor.test.ts` |
| D2: retrying after a 403 without a limit (a loop) | as above                                                 |
| D3: inverted labels for sorting by title          | `features/note-search/noteSearch.test.tsx`               |
| D4: duplicate notes on creation                   | `pages/NoteEditPage/NoteEditPage.test.tsx`               |
| D6: the "Settings" link without a route           | `app/routes/AppRoutes.test.tsx`                          |
| D8: a blank screen on a note loading error        | `pages/NoteEditPage/NoteEditPage.test.tsx`               |

## Known suite behaviour

- **Overloaded machine:** under very heavy CPU load vitest can report `Timeout calling "onTaskUpdate"`, usually on the D8 test, which deliberately crashes the app. This is not test flakiness: under normal load the suite passes reliably (checked many times, ~11 s). If it happens, re-run.
- **Editor focus:** the editor focuses itself asynchronously after mounting. Tests that type a title first wait for the editor focus (`editorFocused()`), otherwise the text would go into the note content.

## Updating this file

After a larger change, run `npm run test:coverage` and compare with the tables above. Assign every new spot below ~90% to a category A–E. If it does not fit any, a test is simply missing.

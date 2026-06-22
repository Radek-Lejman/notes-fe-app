# notes-app-fe

React frontend for a full-stack notes application with nested note hierarchy, rich-text editing, and cookie-based JWT authentication with server-side token tracking.

> **Companion repo:** [notes-app-be](../notes-app-be) — NestJS backend with refresh-token rotation and security hardening.

---

## Tech Stack

| Category      | Technology                                            |
| ------------- | ----------------------------------------------------- |
| Framework     | React 19 + TypeScript 5.8                             |
| Build         | Vite 7                                                |
| Architecture  | Feature-Sliced Design (FSD)                           |
| Data fetching | TanStack Query v5                                     |
| UI            | Chakra UI v3 + Emotion                                |
| Editor        | TipTap v3                                             |
| Router        | React Router DOM v7                                   |
| HTTP          | Axios with CSRF + 401 interceptors                    |
| Code quality  | ESLint (flat config) + Prettier + Husky + lint-staged |

---

## Features

- **Notes management** — create, read, update notes with a nested parent-child hierarchy via `parentId` (delete in progress)
- **Rich-text editor** — TipTap v3 with `/` slash commands and inline bubble menu (bold, italic, strikethrough, code)
- **Inline note linking** — custom `PageReferenceNode` TipTap extension: type `/Sub-note` in the editor to create a child note and insert a clickable inline reference to it (wiki-style linking between notes)
- **Global search** — debounced search (350 ms) with configurable limit (10–50), sort filters (`rank`, `createdAt`, `updatedAt`, `title`), and field scope (4 options: title only → everything)
- **Authentication** — login / register / session check backed by httpOnly cookies
- **Token refresh** — transparent silent refresh with request queuing (no duplicate 401 storms)
- **CSRF protection** — lazy token fetch + automatic retry on 403
- **Dark / Light mode** — via `next-themes`
- **Error boundaries** — `AsyncBoundary` (error boundary + Suspense) wraps the side panel; note editor uses `Suspense` with a spinner fallback

---

## Architecture — Feature-Sliced Design

The project follows [FSD](https://feature-sliced.design/) strictly. Boundaries are enforced by the [`@conarti/eslint-plugin-feature-sliced`](https://github.com/conarti/eslint-plugin-feature-sliced) ESLint plugin — an import that crosses a layer boundary is a lint error caught at commit time (via Husky + lint-staged), not just a convention.

Each layer exposes a public API through its `index.ts`; nothing from inside a slice is imported directly.

```
src/
├── app/              # Composition root: providers, routing, API init
│   ├── init.ts       # Axios setup + CSRF interceptor registration
│   ├── providers/    # Chakra + React Query providers
│   └── routes/       # AppRoutes.tsx
│
├── pages/            # Full screens assembled from widgets/features
│   ├── NoteEditPage/ # Edit or create a note
│   └── WelcomePage/  # Landing / unauthenticated home
│
├── widgets/          # Composite, self-contained UI blocks
│   ├── SidePanelWidget/     # Note tree navigation + user header
│   ├── NoteEditorWidget/    # Editor wrapper (edit vs create mode)
│   └── GlobalSearchWidget/  # Search input + results overlay
│
├── features/         # Business logic units (mutations, forms, guards)
│   ├── auth/         # Login/Register forms, RequireAuth, RedirectIfAuth guards
│   ├── manage-notes/ # Create/update note mutations + editor context + nested note dialog
│   ├── note-search/  # Debounced search hook + filter state
│   └── users/        # (placeholder — user profile)
│
├── entities/         # Domain models + API calls, no UI
│   ├── notes/        # NotesApi, query key factory, React Query hooks, DTO types
│   └── session/      # AuthApi, useSession hook, session types
│
└── shared/           # No business logic — only reusable primitives
    ├── api/          # Axios client, interceptors, queryClient
    ├── ui/           # RichEditor, AsyncBoundary, layouts, AppAlert, Spinner
    └── lib/          # normalizeError, useDebounce, editor extensions
```

### Path aliases

Each FSD layer has a matching TypeScript path alias, configured identically in `vite.config.ts` and `tsconfig.app.json`:

```
@app      → src/app
@pages    → src/pages
@widgets  → src/widgets
@features → src/features
@entities → src/entities
@shared   → src/shared
```

---

## Auth Flow

Authentication is entirely cookie-based. No tokens are stored in `localStorage` or JS-readable memory — access and refresh tokens live in `httpOnly` cookies set by the backend.

```
1. App start
   └─ initApiConfig() → setupCsrfInterceptor(apiClient, { getCsrfToken: AuthApi.getCsrfToken })

2. First mutating request (POST / PUT / PATCH / DELETE)
   └─ CSRF interceptor: csrfToken is null
      ├─ GET /csrf-token → cache token in closure
      └─ inject X-CSRF-Token header → proceed

3. Login
   ├─ POST /auth/login → backend sets httpOnly cookies: access_token + refresh_token
   └─ Axios withCredentials: true → cookies sent automatically on every subsequent request

4. 401 on any request
   ├─ if _skipAuthRefresh = true (e.g. /auth/me) → propagate error, no refresh attempt
   └─ else → handle401Error:
         ├─ if already retried (_retry = true) → reject
         ├─ if URL is /auth/refresh → onUnauthorized() → reject
         ├─ if another refresh is in flight → queue this request in RefreshQueueManager
         └─ else: mark _retry, POST /auth/refresh
             ├─ success → flush queue, retry original request
             └─ failure → flush queue with error → onUnauthorized() → reject

5. 403 on any request
   └─ CSRF interceptor: stale token
      └─ GET /csrf-token → update cached token → retry original request
```

**Why `withCredentials: true`** — httpOnly cookies can't be read by JavaScript, eliminating XSS token theft. The trade-off is CSRF exposure, which the backend mitigates with the double-submit cookie pattern.

**What `onUnauthorized()` does** — clears the React Query cache (`queryClient.clear()`). This causes `useSession` to return no user, which triggers `RequireAuth` to render `<Navigate to="/login" />`. The redirect is a React re-render consequence, not an imperative call inside the interceptor.

**Why `RefreshQueueManager`** — without it, five parallel requests hitting a 401 simultaneously would trigger five concurrent `/auth/refresh` calls. Each call would invalidate the previous token pair, causing a cascade of failures. `RefreshQueueManager` lets the first request own the refresh; the rest are frozen in a promise queue and retried — or rejected together — once the refresh settles.

**Why `_skipAuthRefresh` on `/auth/me`** — the session check runs on every app mount. If it triggered 401 → refresh → 401, the user would be stuck in an infinite loop. Skipping the interceptor on this endpoint breaks the cycle: a 401 from `/auth/me` means the user is simply not logged in.

---

## Getting Started

**Prerequisites:** Node 20+, backend running on port 3000 (see `notes-app-be`).

```bash
npm install

# Set backend URL (default: http://localhost:3000/api)
echo "VITE_API_URL=http://localhost:3000/api" > .env

npm run dev
# → http://localhost:**5173**
```

---

## Scripts

| Command                | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Start Vite dev server with HMR                              |
| `npm run build`        | TypeScript type-check + production build                    |
| `npm run lint`         | ESLint — FSD layer rules + TS strict + TanStack Query rules |
| `npm run format`       | Prettier — format all `src/**/*.{ts,tsx}`                   |
| `npm run format:check` | Prettier check without writing (CI-friendly)                |

Pre-commit hook (Husky + lint-staged) runs `prettier --write` then `eslint --max-warnings=0` on every staged `.ts`/`.tsx` file.

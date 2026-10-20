# notes-app-fe

React 19 + TypeScript + Vite frontend of a markdown note-taking app: nested notes, Tiptap editor (stored as markdown), global search, AI chat/assist. Chakra UI v3, TanStack Query v5, React Router v7, Axios. Code, comments and commit messages in English.

## Second repo

- Backend: `../notes-app-be` (NestJS). **Before editing it, read `../notes-app-be/CLAUDE.md`** — it is not loaded automatically from this session.
- API contract = BE DTOs (`../notes-app-be/src/modules/*/dto`), prefix `/api`, no OpenAPI. Types here are written by hand — keep them in sync.
- `../notes-app-be/docker-compose.yaml` runs the whole stack.
- Start `claude` in the repo root: project hooks and this file are not loaded from the parent directory.

## Commands

| Command | What |
|---|---|
| `npm run verify` | `tsc -b` + eslint + vitest — the gate used by hooks and CI |
| `npm test` / `npx vitest run <path>` | unit/component tests (jsdom, setup in `src/shared/lib/test/setup.ts`) |
| `npm run format:check` | prettier (CI checks it) |
| `npm run build` | `tsc -b && vite build` |
| `npm run dev` | dev server |

Node from `.nvmrc` (22). A fresh checkout/worktree needs `npm ci` — without it git hooks silently do not run.

## Architecture — Feature-Sliced Design (strict)

Enforced by `@conarti/eslint-plugin-feature-sliced` (`layers-slices`, `absolute-relative`, `public-api` are errors).

- Layers, imports only downwards: `app` → `pages` → `widgets` → `features` → `entities` → `shared`. No cross-imports between slices of the same layer (`features/a` must not import `features/b`).
- A slice (`features/*`, `entities/*`, `widgets/*`) has only these segments at its root: `ui/`, `model/`, `api/`, `lib/`, `config/` — never `components/`, `hooks/`, `utils/`, `containers/`.
  - `ui/` — everything with JSX: components, containers, route guards. No JSX outside `ui/`.
  - `model/` — state and domain hooks without JSX (`model/hooks/`, `model/store/`).
  - `api/` — requests and TanStack Query hooks. Fetching an entity belongs to `entities/<name>/api/`, not to a feature.
  - `lib/` — pure helpers specific to the slice.
- Every slice exports its public API from `index.ts`. Import from outside only through it (`@features/auth`), never deep (`@features/auth/ui/LoginForm`).
- `shared/` knows no domain: nothing about notes, users or auth in `shared/ui`; domain UI goes to `entities/*/ui` or `features/*/ui`.
- Aliases: `@app @pages @widgets @features @entities @shared` (`tsconfig.app.json` and `vite.config.ts` — change both).

## Conventions

- HTTP via `@shared/api` (`apiClient`): cookies (`withCredentials`), CSRF token fetched lazily and retried on 403, silent refresh on 401 with a request queue. No tokens in `localStorage`.
- Server state in TanStack Query with query-key factories in `entities/*/api`; no copying server data into local state.
- Note content is markdown (single source of truth for display, FTS and RAG). The markdown serializer lives only here (`src/shared/lib/editor/markdown/`; the BE stores and searches markdown as text). Golden fixtures: `UPDATE_GOLDEN=1 npm test`; a serializer change without updated fixtures is a bug.
- Tests `*.test.ts(x)` next to the file; helpers in `src/shared/lib/test/` (`render.tsx`, `axios.ts`, `editor.ts`). Known defects as `it.fails` (see `docs/testing/README.md`).
- TypeScript is `strict`; `no-explicit-any`, `no-floating-promises`, `no-misused-promises`, `consistent-type-imports` are errors.
- Conventional commits, small commits.

## Rules

Tag: **[enforced: …]** = a tool blocks it; **[described]** = only this file.

- Respect FSD boundaries; do not silence `feature-sliced/*` with `eslint-disable`. [enforced: eslint, lint-staged, CI]
- `eslint-disable` only with `-- reason`. [described]
- No `it.only` / `it.skip` to get green. [enforced: `vitest/no-focused-tests`, `vitest/no-disabled-tests`]
- Never bypass git hooks (`--no-verify`, `-n`, `HUSKY=0`, `core.hooksPath`). [enforced: Claude hook denies]
- No force-push to `main`; `--force-with-lease` only on your feature branch. [enforced: GitHub ruleset + Claude hook]
- Do not read `.env*` (except `.env.example`) or `cookies.txt`. [enforced: permissions.deny + Claude hook]
- Changing `CLAUDE.md`, `.claude/**`, `.husky/**`, `.github/**`, `eslint.config.js` needs the user's consent. [enforced: Claude hook asks]
- New dependency only with a stated reason in your reply. [described]
- Finishing a turn with code changes runs `npm run verify` (Stop hook) — a red result sends you back; if you cannot fix it, say so plainly instead of claiming success. [enforced: Claude Stop hook]

## Git

- Flow: branch (`feature/*`, `fix/*`, `chore/*` …) → `main`, fast-forward only, linear history. There is no `develop` here.
- Commits on `main` are blocked by a hook — branch first.
- Push the branch, wait for green CI, then ff `main` and push it (the ruleset requires green checks on the exact SHA).
- Commit, push, merge and branch deletion only when the user explicitly asks.

## Where to look

- `docs/testing/` — test strategy and audit.
- `../notes-app-be/docs/ai-dev-system/` — the AI workflow and git hooks.
- `.claude/hooks/` — Claude Code hooks (tests: `node --test .claude/hooks/`).

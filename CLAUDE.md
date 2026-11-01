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
- Beyond the layers (`eslint.config.js`, `no-restricted-imports`): `axios` only in `src/shared/api` (everything else uses `apiClient`), no `@/` alias — the layer aliases only.

## Conventions

- HTTP via `@shared/api` (`apiClient`): cookies (`withCredentials`), CSRF token fetched lazily and retried on 403, silent refresh on 401 with a request queue. No tokens in `localStorage`.
- Server state in TanStack Query with query-key factories in `entities/*/api`; no copying server data into local state.
- Note content is markdown (single source of truth for display, FTS and RAG). The markdown serializer lives only here (`src/shared/lib/editor/markdown/`; the BE stores and searches markdown as text). Golden fixtures: `UPDATE_GOLDEN=1 npm test`; a serializer change without updated fixtures is a bug.
- Tests `*.test.ts(x)` next to the file; helpers in `src/shared/lib/test/` (`render.tsx`, `axios.ts`, `editor.ts`). Known defects as `it.fails` (see `docs/testing/README.md`).
- TypeScript is `strict`; `no-explicit-any`, `no-floating-promises`, `no-misused-promises`, `consistent-type-imports` are errors.
- Conventional commits, small commits.

## Code quality

Before writing new code:

- **Reuse first (DRY).** Search for an existing function, hook, component, constant or type before adding one: `grep -rn` the name *and* the behaviour (the regex, the API path, the error message). Reuse or extend it. A second copy of the same logic needs a reason stated in your reply; deliberate copies across the two repos are marked `KEEP IN SYNC`.
- **KISS.** The simplest code that solves today's problem: no abstractions, options or layers "for later". Early returns instead of nested ternaries (at most one `?:` per expression). Derive values instead of keeping them in extra state or fields.
- **Single responsibility (SOLID).** One file does one thing (a component, a hook, a group of pure helpers; fetching, transforming and rendering are separate). A function does one thing at one level of abstraction. Extend by adding a new implementation or a map entry, not another `if` on a type; depend on props and slice public APIs, not on another slice's internals.
- **No catch-all files.** `types.ts`, `consts.ts`, `utils.ts` hold one concept, not everything a slice needs. Before adding to such a file, check that the new code belongs to the concept the file already describes; a second concept gets its own file named after it (`model/types.ts` for notes, `model/import.types.ts` for the import contract; `model/importStep.ts` next to the hook that uses it). Only types and constants go to `types` files: a class (an error) lives with the code that throws it, a function in `lib/`. The same applies when a slice's `index.ts` or a `config/` file starts collecting unrelated exports.
- **Size limits** (tests and fixtures excluded): a file over **150 lines** → consider splitting, over **250** → split it or justify it in your reply; a function over **40 lines** → extract steps; more than **3 parameters** → one options object. JSX nested deeper than ~4 levels → a subcomponent.
- **Named constants, no magic values.** Statuses, kinds and modes are a `const` object with the type derived from it (`as const` + `ValueOf<typeof X>` from `@shared/lib/utils/types`; TS `enum` is blocked by `erasableSyntaxOnly`); compare against `STATUS.member`, not a string literal. Limits and timeouts are named constants with a comment on why that value.
- **Names say what, comments say why** (not what the next line does). No commented-out code, no dead exports.
- **Tests come with the code:** new logic gets a test next to it; a bug fix gets a test that fails without the fix.

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
- HTTP only through `apiClient` (`@shared/api`); imports through the layer aliases, never `@/`. [enforced: eslint]

## Git

- Flow: branch (`feature/*`, `fix/*`, `chore/*` …) → `main`, fast-forward only, linear history. There is no `develop` here.
- Commits on `main` are blocked by a hook — branch first.
- Push the branch, wait for green CI, then ff `main` and push it (the ruleset requires green checks on the exact SHA).
- Commit, push, merge and branch deletion only when the user explicitly asks.

## Where to look

- `docs/testing/` — test strategy and audit.
- `../notes-app-be/docs/ai-dev-system/` — the AI workflow and git hooks.
- `.claude/hooks/` — Claude Code hooks (tests: `node --test .claude/hooks/`).

---
trigger: always_on
---

# [FSD v2 STRICT MODE] - Folder & File Generation Rules

You are strictly bound to Feature-Sliced Design (FSD v2) principles when creating, moving, or refactoring files and folders in this project. Never violate these rules.

## 1. LAYER HIERARCHY (Import Rules)
- **App** -> **Pages** -> **Widgets** -> **Features** -> **Entities** -> **Shared**.
- You can ONLY import from layers below the current one.
- **Cross-imports** between slices on the same layer (e.g., `features/auth` importing from `features/cart`) are STRICTLY FORBIDDEN.

## 2. SLICE ANATOMY (No Technical Folders at Root)
When creating or modifying a Slice (inside `features/`, `entities/`, or `widgets/`), you MUST NOT create technical folders like `components/`, `containers/`, `hooks/`, or `utils/` at the root of the slice.
The ONLY allowed folders (Segments) at the root of a slice are:
- `ui/`
- `model/`
- `api/`
- `lib/`
- `config/`

## 3. SEGMENT RESPONSIBILITIES (Where to put what)
- **`ui/`**: Any file containing JSX or React rendering logic lives here. This includes both Dumb Components (e.g., `AuthForm.tsx`), Smart Components/Containers (e.g., [LoginPageContainer.tsx](cci:7://file:///Users/radoslawlejman/Desktop/Programowanie/REPOS/markdown-note-taking-app/t/src/features/auth/containers/LoginPageContainer.tsx:0:0-0:0)), and route guards (`RequireAuth.tsx`). NEVER put JSX outside of `ui/`.
- **`model/`**: All business logic, state management (Zustand/Redux), and custom domain hooks (e.g., [useLogin.ts](cci:7://file:///Users/radoslawlejman/Desktop/Programowanie/REPOS/markdown-note-taking-app/t/src/features/auth/hooks/useLogin.ts:0:0-0:0), `useToggle.ts`) go here. If it handles state but has no JSX, it belongs in `model/hooks/` or `model/store/`.
- **`api/`**: Server requests, axios calls, and data-fetching hooks (e.g., `useQuery`, `useMutation` that directly fetch Entities). *Never fetch entities directly inside Features! Entity fetching logic belongs to `entities/[name]/api/`.*
- **`lib/`**: Helpers, formatters, and pure functions specific to this slice.

## 4. THE PUBLIC API DICTATORSHIP ([index.ts](cci:7://file:///Users/radoslawlejman/Desktop/Programowanie/REPOS/markdown-note-taking-app/t/src/features/auth/index.ts:0:0-0:0))
- Every slice MUST have an [index.ts](cci:7://file:///Users/radoslawlejman/Desktop/Programowanie/REPOS/markdown-note-taking-app/t/src/features/auth/index.ts:0:0-0:0) file at its root.
- You MUST export ONLY the things that the outside world is allowed to see.
- You MUST NOT use deep imports from outside a slice (e.g., `import X from '@/features/auth/ui/LoginForm'`). Always import from the root alias: `import { X } from '@/features/auth'`.

## 5. 'SHARED' LAYER IS DUMB
- The `shared/` layer must REMAIN IGNORANT of any business domain. 
- Do not put UI components that know about "Users", "Notes", or "Auth" inside `shared/ui/`. If a component is tied to a domain concept, it belongs to `entities/ui/` or `features/ui/`.

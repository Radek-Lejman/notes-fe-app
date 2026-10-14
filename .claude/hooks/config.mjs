// Repo-specific settings for the Claude Code hooks (notes-app-fe). See _common.mjs DEFAULT_CONFIG.
//
// Patterns are fnmatch globs on the path relative to the repo root; `*` also matches `/`.
// The other hook scripts are identical copies of notes-app-be/.claude/hooks — change both.

export const BASE_BRANCH = 'main';
export const PROTECTED_BRANCHES = ['main'];

// Other repos the Stop hook verifies when they changed during the turn (relative to this root).
export const SIBLING_REPOS = ['../notes-app-be'];

// Changes outside these paths (local notes, docs) do not trigger verification.
export const CODE_PATHS = [
  'src',
  'public',
  'index.html',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'eslint.config.js',
];

// Editing these asks the user first.
export const ASK_PATHS = [
  'docs/specs/*',
  // the gates themselves
  '.claude/*',
  'CLAUDE.md',
  '*/CLAUDE.md',
  '.husky/*',
  'scripts/hooks/*',
  '.github/*',
  'eslint.config.*',
];

export const ASK_IF_MERGED_PATHS = [];

// New files matching these ask too (a new hook is a change of the gates).
export const ASK_NEW_FILES = ['.claude/*'];

export const EXTRA_VERIFY = [];

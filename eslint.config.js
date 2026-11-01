import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import pluginQuery from '@tanstack/eslint-plugin-query'
import featureSliced from '@conarti/eslint-plugin-feature-sliced'
import prettierConfig from 'eslint-config-prettier'
import vitest from '@vitest/eslint-plugin'

const RESTRICTED_IMPORTS = {
  paths: [
    {
      name: 'axios',
      message: 'Requests go through apiClient from @shared/api (CSRF, refresh on 401).',
      allowTypeImports: true,
    },
  ],
  patterns: [
    {
      group: ['@/*'],
      message: 'Use the layer alias (@shared, @entities, @features, …) so the FSD rules see the layer.',
    },
  ],
}

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...pluginQuery.configs['flat/recommended'],
      // Must be last — disables ESLint rules that would conflict with Prettier formatting
      prettierConfig,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'feature-sliced': featureSliced,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // Strict TypeScript Rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Feature-Sliced Design Architecture Enforcement
      'feature-sliced/layers-slices': 'error',
      'feature-sliced/absolute-relative': 'error',
      'feature-sliced/public-api': 'error',
    },
  },
  {
    // Import boundaries beyond the FSD layers.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', RESTRICTED_IMPORTS],
    },
  },
  {
    // The HTTP client itself and its test helper are the only places that use axios directly.
    files: ['src/shared/api/**', 'src/shared/lib/test/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: RESTRICTED_IMPORTS.patterns },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      // AI agents tend to silence failing tests instead of fixing them
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'error',
    },
  },
)

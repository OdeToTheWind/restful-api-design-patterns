// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Lint scope: the shared package + intermediate demos and later.
// Beginner demos (Days 1–25) are kept as-written lesson snapshots.
export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/generated/**', 'demos/beginner/**', '**/*.js', '**/*.mjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);

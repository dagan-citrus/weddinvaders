import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Node-side tooling: Playwright specs and the build/test configs
    files: ['e2e/**/*.js', 'playwright.config.js', 'vite.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // Test files export helpers and render components outside the HMR rules
    files: ['src/test/**', '**/*.test.{js,jsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])

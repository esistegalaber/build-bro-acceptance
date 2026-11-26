// ESLint: the recommended JS and type-checked TypeScript rules everywhere (a missing `await` is a
// no-floating-promises error), plus eslint-plugin-playwright's rules for specs
// (no waitForTimeout, no focused tests, web-first assertions, ...).
import js from '@eslint/js'
import {defineConfig} from 'eslint/config'
import playwright from 'eslint-plugin-playwright'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'blob-report/']},
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {parserOptions: {projectService: true}},
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['tests/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      // test.skip(condition, reason) is fine; a bare test.skip() is not
      'playwright/no-skipped-test': ['warn', {allowConditional: true}],
    },
  },
)

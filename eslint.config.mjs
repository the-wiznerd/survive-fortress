import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import vue from 'eslint-plugin-vue'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/.yarn/**',
      '**/coverage/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.{ts,tsx,js,mjs,cjs,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'semi': ['error', 'never'],
      'no-extra-semi': 'error',
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'vue/script-indent': ['error', 2, { baseIndent: 1, switchCase: 1 }],
      // TypeScript exhaustive switches return on every reachable branch, but
      // this rule can't see that. Disable in favor of TS's own checks.
      'vue/return-in-computed-property': 'off',
    },
  },
  {
    // Client ambient types declared in packages/client/src/types/*.d.ts.
    // ESLint can't see `declare global` types, so we list them as globals here.
    files: ['packages/client/**/*.{ts,vue}'],
    languageOptions: {
      globals: {
        RoundPhase: 'readonly',
        PlanProgress: 'readonly',
        SidebarView: 'readonly',
        SidebarStackEntry: 'readonly',
        CellCoord: 'readonly',
      },
    },
  },
]
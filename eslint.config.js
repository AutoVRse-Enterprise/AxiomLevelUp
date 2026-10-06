import eslint from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const threeRestriction = {
  regex: '^three(?:/|$)',
  message: 'Import Three.js only from src/anatomy3d/three/createAnatomyController.ts.',
}
const sharedExperienceRestrictions = [
  {
    regex: '^@experience$',
    message: 'Only src/app/App.tsx and src/app/router.tsx may import the active experience.',
  },
  {
    regex: '^@/experiences(?:/|$)',
    message: 'Shared modules must not import experience composition.',
  },
]

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dist-sanofi',
      'dev-dist',
      'dev-dist-sanofi',
      'coverage',
      'schemas',
      'public',
      '.tmp',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [threeRestriction],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/experiences/**', 'src/app/App.tsx', 'src/app/router.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [threeRestriction, ...sharedExperienceRestrictions] },
      ],
    },
  },
  {
    files: ['src/experiences/default/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            threeRestriction,
            {
              regex: '^@/experiences/sanofi(?:/|$)',
              message: 'The default experience must not import the sanofi experience.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/experiences/sanofi/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            threeRestriction,
            {
              regex: '^@/experiences/default(?:/|$)',
              message: 'The sanofi experience must not import the default experience.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/anatomy3d/three/createAnatomyController.ts', 'src/spikes/anatomy3d/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: sharedExperienceRestrictions }],
    },
  },
  {
    files: ['src/app/router.tsx', 'src/experiences/*/routes.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['scripts/**/*.{ts,mjs}', 'vite.config.ts'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
)

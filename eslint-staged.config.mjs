// Simple ESLint configuration for lint-staged
// This avoids the module import conflicts with the main config
import typescriptEslint from 'typescript-eslint';

export default typescriptEslint.config({
  files: ['**/*.{ts,tsx}'],
  extends: [...typescriptEslint.configs.recommended],
  plugins: {
    '@typescript-eslint': typescriptEslint.plugin,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
    eqeqeq: ['error', 'always'],
  },
});

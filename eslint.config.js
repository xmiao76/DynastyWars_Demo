import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // The simulation must stay deterministic and headless.
    files: ['src/sim/**/*.ts', 'src/core/**/*.ts', 'src/data/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded world RNG.' },
      ],
      'no-restricted-globals': ['error', 'Date', 'performance', 'window', 'document'],
    },
  },
);

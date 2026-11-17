import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    testTimeout: 60_000,
    coverage: {
      provider: 'v8',
      include: ['src/core/**', 'src/sim/**', 'src/data/**'],
      exclude: ['**/*.test.ts', 'src/sim/types.ts'],
      thresholds: { lines: 80, statements: 80, functions: 80 },
    },
  },
});

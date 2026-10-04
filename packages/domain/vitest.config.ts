import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'domain',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts', 'src/testing/**', 'src/shared/testing.ts'],
      reporter: ['text-summary'],
      // Objectif de la Definition of Done : >= 80 % sur le domaine et l'application.
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});

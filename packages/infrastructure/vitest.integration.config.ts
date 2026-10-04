import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'infrastructure:integration',
    environment: 'node',
    include: ['src/**/*.int.test.ts'],
    globalSetup: ['./test/postgresGlobalSetup.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});

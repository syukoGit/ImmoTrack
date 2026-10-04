import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'infrastructure:unit',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.int.test.ts'],
  },
});

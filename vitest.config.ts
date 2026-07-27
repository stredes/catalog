import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/application/**/*.ts', 'src/modules/**/infrastructure/**/*.ts', 'src/shared/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.d.ts'],
      reporter: ['text', 'lcov'],
    },
  },
});

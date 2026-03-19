import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/utils/testSetup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '__tests__/',
        'tests/',
        'playwright/',
        'dist/',
        'build/',
        '*.config.js',
        '*.config.ts',
        'coverage/',
      ],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 2,
        maxThreads: 4,
      },
    },
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/results.json',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '@/components': path.resolve(__dirname, './app/components'),
      '@/lib': path.resolve(__dirname, './app/lib'),
      '@/types': path.resolve(__dirname, './types'),
      '@/repository': path.resolve(__dirname, './repository'),
    },
  },
})

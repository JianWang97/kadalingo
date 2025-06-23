import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'build',
      '.vite',
      'src/main/**',
      'src/main.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        'src/main/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/vite.*.config.*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@renderer': resolve(__dirname, './src/renderer'),
      '@data': resolve(__dirname, './src/data')
    }
  }
});

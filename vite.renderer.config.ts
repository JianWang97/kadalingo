import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import type { PluginOption } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  root: 'src/renderer',
  plugins: [react()] as PluginOption[],
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/renderer/index.html'),
      external: [],
    },
  },
  optimizeDeps: {
    include: ['scheduler'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()] as PluginOption[],
  build: {
    rollupOptions: {
      // Remove scheduler from external to bundle it
      external: [],
    },
  },
  optimizeDeps: {
    include: ['scheduler'],
  },
});

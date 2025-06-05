import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { PluginOption } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()] as PluginOption[],
  build: {
    rollupOptions: {
      external: ['scheduler'],
    },
  },
  optimizeDeps: {
    include: ['scheduler'],
  },
});
